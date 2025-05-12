import { users, posts, games } from "./config/mongoCollections.js";
import { dbConnection, closeConnection } from "./config/mongoConnection.js";
import bcrypt from "bcryptjs";

import gameData from "./data/game.js";

async function seedUsers() {
    const userCollection = await users();

    await userCollection.deleteMany({});

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("Password123!", saltRounds);

    // Sample users
    const userData = [
        {
            email: "admin@example.com",
            hashedPassword,
            username: "admin",
            role: "admin",
            bio: "Administrator account for the GameForum platform",
            platforms: ["PC", "PlayStation", "Xbox"],
            selectedGames: ["League of Legends", "Valorant"],
            favoriteCharacters: {
                "League of Legends": ["Garen", "Lux"],
                Valorant: ["Jett", "Sage"],
            },
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
                {
                    name: "First Post!",
                    earnedOn: new Date().toISOString().split("T")[0],
                },
            ],
            createdAt: new Date().toISOString(),
        },
        {
            email: "user1@example.com",
            hashedPassword,
            username: "gamer123",
            role: "user",
            bio: "Avid gamer who loves MOBAs and FPS games",
            platforms: ["PC"],
            selectedGames: [
                "League of Legends",
                "Valorant",
                "Marvel Rivals",
                "Overwatch 2",
            ],
            favoriteCharacters: {
                "League of Legends": ["Ezreal", "Lux"],
                Valorant: ["Jett"],
                "Marvel Rivals": ["Iron Man", "Doctor Strange"],
                "Overwatch 2": ["Tracer", "Mercy"],
            },
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
                {
                    name: "First Post!",
                    earnedOn: new Date().toISOString().split("T")[0],
                },
            ],
            createdAt: new Date().toISOString(),
        },
    ];

    const insertResults = await userCollection.insertMany(userData);
    console.log("User data seeded successfully");

    const usersList = await userCollection.find({}).toArray();

    const user1Id = usersList[0]._id.toString();
    const user2Id = usersList[1]._id.toString();

    await userCollection.updateOne(
        { _id: usersList[0]._id },
        { $set: { friends: [user2Id] } }
    );

    await userCollection.updateOne(
        { _id: usersList[1]._id },
        { $set: { friends: [user1Id] } }
    );

    console.log("User friendships updated");

    return usersList;
}

async function seedPosts(usersList, gamesList) {
    const postsCollection = await posts();

    await postsCollection.deleteMany({});

    const postData = [];

    const user1 = usersList[0];
    const user2 = usersList[1];

    const getRandomCharacter = (gameName) => {
        const game = gamesList.find((g) => g.name === gameName);
        if (game && game.characters && game.characters.length > 0) {
            const randomIndex = Math.floor(
                Math.random() * game.characters.length
            );
            return game.characters[randomIndex].name;
        }
        return null;
    };

    const lolGame = gamesList.find((g) => g.name === "League of Legends");
    const lolChars = lolGame?.characters || [];

    if (lolChars.length > 0) {
        postData.push({
            userId: user1._id.toString(),
            username: user1.username,
            game: "League of Legends",
            character: lolChars[0].name,
            title: `Best ${lolChars[0].name} build for season 14`,
            body: `I've been trying different builds for ${lolChars[0].name} in season 14, and here's what I found most effective...`,
            tags: ["strategy", "build", lolChars[0].role.toLowerCase()],
            media: [],
            likes: 1,
            comments: [
                {
                    _id: new Date().getTime().toString(),
                    userId: user2._id.toString(),
                    username: user2.username,
                    comment: "Great build! I'll try it in my next game.",
                    timestamp: new Date().toISOString(),
                },
            ],
            timestamp: new Date().toISOString(),
        });

        if (lolChars.length > 1) {
            postData.push({
                userId: user2._id.toString(),
                username: user2.username,
                game: "League of Legends",
                character: lolChars[1].name,
                title: `${lolChars[1].name} support vs mid - which is better now?`,
                body: `With the recent changes to ${lolChars[1].name}, I'm wondering if they're better as a support or mid laner...`,
                tags: ["discussion", "meta"],
                media: [],
                likes: 8,
                comments: [],
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            });
        }
    } else {
        postData.push({
            userId: user1._id.toString(),
            username: user1.username,
            game: "League of Legends",
            character: "Garen",
            title: "Best Garen build for top lane season 14",
            body: "I've been trying different builds for Garen in season 14, and here's what I found most effective...",
            tags: ["strategy", "build", "top lane"],
            media: [],
            likes: 15,
            comments: [
                {
                    _id: new Date().getTime().toString(),
                    userId: user2._id.toString(),
                    username: user2.username,
                    comment: "Great build! I'll try it in my next game.",
                    timestamp: new Date().toISOString(),
                },
            ],
            timestamp: new Date().toISOString(),
        });
    }

    // Create posts for Valorant
    const valorantGame = gamesList.find((g) => g.name === "Valorant");
    const valorantChars = valorantGame?.characters || [];

    if (valorantChars.length > 0) {
        postData.push({
            userId: user1._id.toString(),
            username: user1.username,
            game: "Valorant",
            character: valorantChars[0].name,
            title: `${valorantChars[0].name} nerf - how to adapt?`,
            body: `Since the recent nerf to ${valorantChars[0].name}'s abilities, I've had to change my playstyle. Here's what's working...`,
            tags: ["strategy", "tips"],
            media: [],
            likes: 23,
            comments: [
                {
                    _id: new Date().getTime().toString(),
                    userId: user2._id.toString(),
                    username: user2.username,
                    comment:
                        "I totally agree! The timing window is much trickier now.",
                    timestamp: new Date().toISOString(),
                },
            ],
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        });
    }

    // Create posts for Marvel Rivals
    const marvelGame = gamesList.find((g) => g.name === "Marvel Rivals");
    const marvelChars = marvelGame?.characters || [];

    if (marvelChars.length > 0) {
        postData.push({
            userId: user2._id.toString(),
            username: user2.username,
            game: "Marvel Rivals",
            character: marvelChars[0].name,
            title: `${marvelChars[0].name} combo guide for beginners`,
            body: `If you're new to playing ${marvelChars[0].name} in Marvel Rivals, here are some basic combos to get you started...`,
            tags: ["guide", "beginners"],
            media: [],
            likes: 12,
            comments: [],
            timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        });
    }

    // Post for Overwatch 2
    const owGame = gamesList.find((g) => g.name === "Overwatch 2");
    const owChars = owGame?.characters || [];

    if (owChars.length > 0) {
        const dpsChar = owChars.find((c) => c.role === "Damage") || owChars[0];

        postData.push({
            userId: user1._id.toString(),
            username: user1.username,
            game: "Overwatch 2",
            character: dpsChar.name,
            title: `${dpsChar.name} tips for beginners`,
            body: `Mastering ${dpsChar.name}'s abilities can carry games. Here's what worked for me...`,
            tags: ["guide", dpsChar.name.toLowerCase(), "mechanics"],
            media: [],
            likes: 10,
            comments: [],
            timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        });
    }

    await postsCollection.insertMany(postData);
    console.log("Post data seeded successfully");

    return postData;
}

// Execute the seed function
async function main() {
    const db = await dbConnection();
    try {
        console.log("Starting database seeding...");

        console.log("Ensuring games are initialized...");
        const gamesList = await gameData.initializeGames();

        console.log("Seeding users...");
        const usersList = await seedUsers();

        console.log("Seeding posts...");
        await seedPosts(usersList, gamesList);

        console.log("All data seeded successfully!");
    } catch (e) {
        console.error("Error during seeding:", e);
    } finally {
        await closeConnection();
    }
}

main();
