import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { notifications } from "../config/mongoCollections.js";
import bcrypt from "bcryptjs";
import {
    validateEmail,
    validateString,
    validatePassword,
} from "../helpers/validation.js";

export const registerUser = async ({
    email,
    username,
    password,
    confirmPassword,
    role = "user", // Default role is "user" if not specified
    favoriteGames = [],
    favoriteCharacters = [],
}) => {
    // Input validation
    email = validateEmail(email);
    username = validateString(username, "Username", 3, 20);
    password = validatePassword(password);

    // Validate role
    if (role !== "user" && role !== "admin") {
        role = "user"; // Default to user if invalid role provided
    }

    // Confirm passwords match
    if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
    }

    // Check if email already exists
    const userCollection = await users();
    const existingEmail = await userCollection.findOne({ email: email });
    if (existingEmail) {
        throw new Error("An account with this email already exists");
    }

    // Check if username already exists (case insensitive)
    const existingUsername = await userCollection.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (existingUsername) {
        throw new Error("Username already taken");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Process favorite characters
    const favoriteCharactersMap = {};

    if (Array.isArray(favoriteCharacters) && favoriteCharacters.length > 0) {
        // Process characters from select multiple (format: "Game:Character")
        favoriteCharacters.forEach((charString) => {
            const [game, character] = charString.split(":");
            if (game && character) {
                if (!favoriteCharactersMap[game]) {
                    favoriteCharactersMap[game] = [];
                }
                favoriteCharactersMap[game].push(character);
            }
        });
    }

    // Create user object
    const newUser = {
        email,
        hashedPassword,
        username,
        role, // Use the role from input or default
        bio: "",
        platforms: [],
        selectedGames: Array.isArray(favoriteGames) ? favoriteGames : [],
        favoriteCharacters: favoriteCharactersMap,
        friends: [],
        privacySettings: {
            profilePublic: true,
            showPosts: true,
            showCharacters: true,
            showBio: true,
            showAchievements: true,
        },
        achievements: [
            {
                name: "First Sign Up!",
                earnedOn: new Date().toISOString().split("T")[0],
            },
        ],
        createdAt: new Date().toISOString(),
    };

    // Insert into database
    const insertInfo = await userCollection.insertOne(newUser);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw new Error("Could not add user");
    }

    return {
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
    };
};

export const loginUser = async ({ email, password }) => {
    // Input validation
    email = validateEmail(email);
    if (!password || typeof password !== "string") {
        throw new Error("Password must be a non empty string.");
    }

    // Find user
    const userCollection = await users();
    const user = await userCollection.findOne({ email: email });
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
        throw new Error("Invalid email or password");
    }

    // Return user info (excluding sensitive data)
    return {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        selectedGames: user.selectedGames,
        favoriteCharacters: user.favoriteCharacters,
    };
};

//Function to send friend requests to other users.
export const sendFriendRequest = async (fromUserId, toUserId) => {
    //Checking userId to see if it is a valid user.
    if (!ObjectId.isValid(fromUserId) || !ObjectId.isValid(toUserId)) {
        throw new Error("Invalid user ID(s)");
    }

    //Checking if a user inputted their own id.
    if (fromUserId === toUserId) {
        throw new Error("You cannot send a friend request to yourself.");
    }

    //Getting all the usrs in the database and finding the users with the userIds inputted.
    const userCollection = await users();
    const toUser = await userCollection.findOne({
        _id: new ObjectId(toUserId),
    });
    const fromUser = await userCollection.findOne({
        _id: new ObjectId(fromUserId),
    });

    if (!toUser || !fromUser) {
        throw new Error("User(s) not found");
    }

    //Collecting all notifications and seeing if a friend request was already sent to the user inputted.
    const notificationCollection = await notifications();

    const existingRequest = await notificationCollection.findOne({
        type: "friend_request",
        fromUserId: fromUserId,
        toUserId: toUserId,
    });

    if (existingRequest) {
        throw new Error("Friend request already sent");
    }

    //Sending notification to user of the friend request.
    const notification = {
        type: "friend_request",
        fromUserId,
        toUserId,
        message: `${fromUser.username} sent you a friend request.`,
        seen: false,
        timestamp: new Date().toISOString(),
    };

    await notificationCollection.insertOne(notification);
    return { success: true };
};

//Function to accept friend requests.
export const acceptFriendRequest = async (currentUserId, fromUserId) => {
    //Checking userIds to see if the ids are valid.
    if (!ObjectId.isValid(currentUserId) || !ObjectId.isValid(fromUserId)) {
        throw new Error("Invalid ID");
    }

    //Collecting all of the users in the database.
    const usersCollection = await users();
    const currentUser = await usersCollection.findOne({
        _id: new ObjectId(currentUserId),
    });
    const sender = await usersCollection.findOne({
        _id: new ObjectId(fromUserId),
    });

    if (!currentUser || !sender) {
        throw new Error("User(s) not found");
    }

    //Updating user information if the friend request was accepted.
    await usersCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $addToSet: { friends: fromUserId } }
    );

    await usersCollection.updateOne(
        { _id: new ObjectId(fromUserId) },
        { $addToSet: { friends: currentUserId } }
    );

    //Sending notifcation of the friend request.
    const notificationCollection = await notifications();
    await notificationCollection.insertOne({
        type: "friend_accept",
        fromUserId: currentUserId,
        toUserId: fromUserId,
        message: `${currentUser.username} accepted your friend request.`,
        seen: false,
        timestamp: new Date().toISOString(),
    });

    return { success: true };
};

//Function to view all of the notifications for the user.
export const getNotificationsForUser = async (userId) => {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const notificationCollection = await notifications();

    return await notificationCollection
        .find({ toUserId: userId, seen: false })
        .sort({ timestamp: -1 })
        .toArray();
};

//Function to mark all notifications as read.
export const markNotificationsSeen = async (userId) => {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const notificationCollection = await notifications();
    await notificationCollection.updateMany(
        { toUserId: userId, seen: false },
        { $set: { seen: true } }
    );

    await notificationCollection.deleteMany({
        toUserId: userId,
        type: "friend_request",
    });
};
