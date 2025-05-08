import { users } from "../config/mongoCollections.js";
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
        throw "Passwords do not match";
    }

    // Check if email already exists
    const userCollection = await users();
    const existingEmail = await userCollection.findOne({ email: email });
    if (existingEmail) {
        throw "An account with this email already exists";
    }

    // Check if username already exists (case insensitive)
    const existingUsername = await userCollection.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (existingUsername) {
        throw "Username already taken";
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
        throw "Could not add user";
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
        throw "Password must be a non-empty string.";
    }

    // Find user
    const userCollection = await users();
    const user = await userCollection.findOne({ email: email });
    if (!user) {
        throw "Invalid email or password";
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
        throw "Invalid email or password";
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
