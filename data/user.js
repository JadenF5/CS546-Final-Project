import bcrypt from "bcryptjs";
import { users as usersCollection } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    validateEmail,
    validatePassword,
    validateString,
} from "../helpers/validation.js";

export const registerUser = async ({
    email,
    username,
    password,
    confirmPassword,
    favoriteGame,
    favoriteCharacters = [],
}) => {
    if (!email || !username || !password || !confirmPassword)
        throw "All fields are required.";
    if (password !== confirmPassword) throw "Passwords do not match.";

    const users = await usersCollection();

    const normalizedEmail = validateEmail(email.toLowerCase());
    const normalizedUsername = validateString(
        username.toLowerCase(),
        "Username",
        3,
        20
    );
    const validatedPassword = validatePassword(password);

    const existingEmail = await users.findOne({ email: normalizedEmail });
    if (existingEmail) throw "An account with this email already exists.";

    const existingUsername = await users.findOne({
        username: normalizedUsername,
    });
    if (existingUsername) throw "An account with this username already exists.";

    const hashedPassword = await bcrypt.hash(validatedPassword, 12);

    const selectedGames = favoriteGame ? [favoriteGame] : [];
    const favoriteCharObj =
        favoriteGame && favoriteCharacters.length
            ? {
                  [favoriteGame]: Array.isArray(favoriteCharacters)
                      ? favoriteCharacters
                      : [favoriteCharacters],
              }
            : {};

    const newUser = {
        email: normalizedEmail,
        username: normalizedUsername,
        hashedPassword,
        role: "user",
        bio: "",
        platforms: [],
        selectedGames,
        favoriteCharacters: favoriteCharObj,
        friends: [],
        achievements: [],
        privacySettings: {
            profilePublic: true,
            showPosts: true,
            showCharacters: true,
            showBio: true,
            showAchievements: true,
        },
    };

    const insertResult = await users.insertOne(newUser);
    if (!insertResult.acknowledged) throw "Failed to register user.";
    return { userCreated: true };
};

export const loginUser = async ({ email, password }) => {
    if (!email || !password) throw "All fields must be provided.";

    const users = await usersCollection();
    const user = await users.findOne({
        email: validateEmail(email.toLowerCase()),
    });
    if (!user) throw "Invalid email or password.";

    const validPassword = await bcrypt.compare(
        validatePassword(password),
        user.hashedPassword
    );
    if (!validPassword) throw "Invalid email or password.";

    return {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
    };
};
