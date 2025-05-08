import { games, users, posts } from "./config/mongoCollections.js";
import { dbConnection, closeConnection } from "./config/mongoConnection.js";
import bcrypt from "bcryptjs";

async function seedGames() {
    const gamesCollection = await games();

    // Clear existing data
    await gamesCollection.deleteMany({});

    // Sample games
    const gameData = [
        {
            name: "League of Legends",
            genre: "MOBA",
            platforms: ["PC"],
            characters: [
                { name: "Garen", role: "Top", image: "garen.png" },
                { name: "Ezreal", role: "ADC", image: "ezreal.png" },
                { name: "Lux", role: "Mid", image: "lux.png" },
                { name: "Lee Sin", role: "Jungle", image: "leesin.png" },
            ],
        },
        {
            name: "Valorant",
            genre: "FPS",
            platforms: ["PC"],
            characters: [
                { name: "Jett", role: "Duelist", image: "jett.png" },
                { name: "Sage", role: "Sentinel", image: "sage.png" },
                {
                    name: "Brimstone",
                    role: "Controller",
                    image: "brimstone.png",
                },
                { name: "Sova", role: "Initiator", image: "sova.png" },
            ],
        },
        {
            name: "Marvel Rivals",
            genre: "Hero Shooter",
            platforms: ["PC", "PlayStation", "Xbox"],
            characters: [
                { name: "Iron Man", role: "Damage", image: "ironman.png" },
                {
                    name: "Doctor Strange",
                    role: "Support",
                    image: "drstrange.png",
                },
                { name: "Storm", role: "Area Control", image: "storm.png" },
                { name: "Magneto", role: "Tank", image: "magneto.png" },
            ],
        },
        {
            name: "Teamfight Tactics",
            genre: "Auto Battler",
            platforms: ["PC", "Mobile"],
            characters: [
                { name: "Ahri", role: "Mage", image: "ahri.png" },
                { name: "Jinx", role: "Marksman", image: "jinx.png" },
                { name: "Sett", role: "Bruiser", image: "sett.png" },
                { name: "Lux", role: "Sorcerer", image: "lux_tft.png" },
            ],
        },
        {
            name: "Overwatch 2",
            genre: "Hero Shooter",
            platforms: ["PC", "PlayStation", "Xbox"],
            characters: [
                { name: "Tracer", role: "Damage", image: "tracer.png" },
                { name: "Reinhardt", role: "Tank", image: "reinhardt.png" },
                { name: "Mercy", role: "Support", image: "mercy.png" },
                { name: "Genji", role: "Damage", image: "genji.png" }
            ]
        }
    ];

    await gamesCollection.insertMany(gameData);
    console.log("Game data seeded successfully");

    return gameData;
}

async function seedUsers() {
    const userCollection = await users();

    // Clear existing data
    await userCollection.deleteMany({});

    // Create hashed password
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
            selectedGames: ["League of Legends", "Valorant", "Marvel Rivals", "Overwatch 2"],
            favoriteCharacters: {
                "League of Legends": ["Ezreal", "Lux"],
                Valorant: ["Jett"],
                "Marvel Rivals": ["Iron Man", "Doctor Strange"],
                "Overwatch 2": ["Tracer", "Mercy"]
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
            ],
            createdAt: new Date().toISOString(),
        },
    ];

    const insertResults = await userCollection.insertMany(userData);
    console.log("User data seeded successfully");

    // Update friends list with the created user IDs
    const usersList = await userCollection.find({}).toArray();

    // Make users friends with each other
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

async function seedPosts(usersList, gameData) {
    const postsCollection = await posts();

    // Clear existing data
    await postsCollection.deleteMany({});

    // Sample posts
    const postData = [];

    // Get the first user
    const user1 = usersList[0];
    const user2 = usersList[1];

    // Create posts for League of Legends
    const lolGame = gameData.find((game) => game.name === "League of Legends");

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

    postData.push({
        userId: user2._id.toString(),
        username: user2.username,
        game: "League of Legends",
        character: "Lux",
        title: "Lux support vs mid - which is better now?",
        body: "With the recent changes to Lux, I'm wondering if she's better as a support or mid laner...",
        tags: ["discussion", "meta"],
        media: [],
        likes: 8,
        comments: [],
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    });

    // Create posts for Valorant
    const valorantGame = gameData.find((game) => game.name === "Valorant");

    postData.push({
        userId: user1._id.toString(),
        username: user1.username,
        game: "Valorant",
        character: "Jett",
        title: "Jett dash nerf - how to adapt?",
        body: "Since the recent nerf to Jett's dash, I've had to change my playstyle. Here's what's working...",
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

    // Create posts for Marvel Rivals
    postData.push({
        userId: user2._id.toString(),
        username: user2.username,
        game: "Marvel Rivals",
        character: "Iron Man",
        title: "Iron Man combo guide for beginners",
        body: "If you're new to playing Iron Man in Marvel Rivals, here are some basic combos to get you started...",
        tags: ["guide", "beginners"],
        media: [],
        likes: 12,
        comments: [],
        timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    });

    // Post for Overwatch 2
    postData.push({
        userId: user1._id.toString(),
        username: user1.username,
        game: "Overwatch 2",
        character: "Genji",
        title: "Genji tips for beginners",
        body: "Mastering Genji's dash and deflect can carry games. Here’s what worked for me...",
        tags: ["guide", "genji", "mechanics"],
        media: [],
        likes: 10,
        comments: [],
        timestamp: new Date(Date.now() - 14400000).toISOString() // 4 hours ago
    });

    await postsCollection.insertMany(postData);
    console.log("Post data seeded successfully");

    return postData;
}

// Execute the seed function
async function main() {
    const db = await dbConnection();
    try {
        const gameData = await seedGames();
        const usersList = await seedUsers();
        await seedPosts(usersList, gameData);

        console.log("All data seeded successfully!");
    } catch (e) {
        console.error("Error during seeding:", e);
    } finally {
        await closeConnection();
    }
}

main();
