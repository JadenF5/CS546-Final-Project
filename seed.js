import { games, users, posts } from "./config/mongoCollections.js";
import { dbConnection, closeConnection } from "./config/mongoConnection.js";
import bcrypt from "bcryptjs";
import axios from "axios";

// Import the game API functions
import {
    getLeagueCharacters,
    getTFTChampions,
    getMarvelRivalsCharacters,
    getValorantAgents,
} from "./services/gameApi.js";

async function fetchCharacterDetails(game) {
    try {
        let characters = [];

        switch (game) {
            case "League of Legends":
                try {
                    const version = "14.9.1"; // Use latest version
                    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
                    console.log(`Fetching League of Legends data from: ${url}`);

                    const { data } = await axios.get(url);

                    characters = Object.values(data.data).map((champ) => ({
                        name: champ.name,
                        role: champ.tags[0] || "Unknown",
                        image: `${champ.id}.png`,
                        description: champ.blurb,
                    }));

                    console.log(
                        `Successfully retrieved ${characters.length} League of Legends characters`
                    );
                } catch (e) {
                    console.error(
                        "\x1b[31m%s\x1b[0m",
                        `ERROR: League of Legends API fetch failed: ${e.message}`
                    );
                    characters = [
                        {
                            name: "Garen",
                            role: "Fighter",
                            image: "garen.png",
                            description: "A noble warrior of Demacia",
                        },
                        {
                            name: "Ezreal",
                            role: "Marksman",
                            image: "ezreal.png",
                            description: "A daring adventurer",
                        },
                        {
                            name: "Lux",
                            role: "Mage",
                            image: "lux.png",
                            description: "A light mage of Demacia",
                        },
                        {
                            name: "Lee Sin",
                            role: "Fighter",
                            image: "leesin.png",
                            description:
                                "A blind monk with exceptional fighting abilities",
                        },
                    ];
                }
                break;

            case "Valorant":
                try {
                    const url = `https://valorant-api.com/v1/agents`;
                    console.log(`Fetching Valorant data from: ${url}`);

                    const { data } = await axios.get(url);

                    characters = data.data
                        .filter((agent) => agent.isPlayableCharacter)
                        .map((agent) => ({
                            name: agent.displayName,
                            role: agent.role?.displayName || "Unknown",
                            image: `${agent.displayName.toLowerCase()}.png`,
                            description: agent.description,
                        }));

                    console.log(
                        `Successfully retrieved ${characters.length} Valorant agents`
                    );
                } catch (e) {
                    console.error(
                        "\x1b[31m%s\x1b[0m",
                        `ERROR: Valorant API fetch failed: ${e.message}`
                    );
                    characters = [
                        {
                            name: "Jett",
                            role: "Duelist",
                            image: "jett.png",
                            description:
                                "Representing her home country of South Korea",
                        },
                        {
                            name: "Sage",
                            role: "Sentinel",
                            image: "sage.png",
                            description: "The stronghold of China",
                        },
                        {
                            name: "Brimstone",
                            role: "Controller",
                            image: "brimstone.png",
                            description: "Joining from the USA",
                        },
                        {
                            name: "Sova",
                            role: "Initiator",
                            image: "sova.png",
                            description:
                                "Born from the eternal winter of Russia",
                        },
                    ];
                }
                break;

            case "Teamfight Tactics":
                try {
                    // Updated for TFT to process data correctly
                    const version = "13.24.1"; // Using version from your paste
                    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`;
                    console.log(`Fetching TFT data from: ${url}`);

                    const response = await axios.get(url);
                    const champData = response.data.data;

                    // Process the proper TFT champion data format
                    characters = Object.values(champData).map((champ) => {
                        // Extract proper name
                        let name = champ.name;

                        // Try to determine role from id if available
                        let role;
                        if (champ.id.includes("TFT")) {
                            const parts = champ.id.split("_");
                            // Some TFT champions have traits in their ID that we can use as role
                            role = parts.length > 1 ? parts[1] : "Unknown";
                        } else {
                            role = "Unknown";
                        }

                        return {
                            name: name,
                            role: role,
                            image: `${champ.id.toLowerCase()}.png`,
                            description: "TFT champion",
                        };
                    });

                    console.log(
                        `Successfully retrieved ${characters.length} TFT champions`
                    );
                } catch (e) {
                    console.error(
                        "\x1b[31m%s\x1b[0m",
                        `ERROR: TFT API fetch failed: ${e.message}`
                    );
                    console.error(e);

                    characters = [
                        {
                            name: "Ahri",
                            role: "Mage",
                            image: "ahri.png",
                            description:
                                "A nine-tailed fox with charm abilities",
                        },
                        {
                            name: "Jinx",
                            role: "Marksman",
                            image: "jinx.png",
                            description:
                                "A chaotic marksman with explosive abilities",
                        },
                        {
                            name: "Sett",
                            role: "Bruiser",
                            image: "sett.png",
                            description:
                                "The boss of Ionia's underground fighting pits",
                        },
                        {
                            name: "Lux",
                            role: "Sorcerer",
                            image: "lux_tft.png",
                            description:
                                "A light mage with powerful beam attacks",
                        },
                    ];
                }
                break;

            case "Marvel Rivals":
                try {
                    // Using the actual Marvel Rivals API with your key
                    const url = "https://marvelrivalsapi.com/api/v1/heroes";
                    const apiKey =
                        "e736f7a0f1fc493f8bb02974b557174a132040d729bd8ac77e449e783c6a01d4";

                    console.log(`Fetching Marvel Rivals data from: ${url}`);

                    const response = await axios.get(url, {
                        headers: {
                            "x-api-key": apiKey,
                            "Content-Type": "application/json",
                        },
                    });

                    // Process the response based on the expected API format
                    // Adjust this based on actual API response structure
                    characters = response.data.map((hero) => ({
                        name: hero.name,
                        role: hero.role || hero.class || "Unknown",
                        image: `https://marvelrivalsapi.com${hero.imageUrl}`,
                        description:
                            hero.description || `A hero in Marvel Rivals`,
                    }));

                    console.log(
                        `Successfully retrieved ${characters.length} Marvel Rivals heroes`
                    );
                } catch (e) {
                    console.error(
                        "\x1b[31m%s\x1b[0m",
                        `ERROR: Marvel Rivals API fetch failed: ${e.message}`
                    );
                    // Fallback still here for when API is unavailable
                    characters = [
                        {
                            name: "Iron Man",
                            role: "Damage",
                            image: "ironman.png",
                            description:
                                "Genius billionaire playboy philanthropist",
                        },
                        {
                            name: "Doctor Strange",
                            role: "Support",
                            image: "drstrange.png",
                            description: "Master of the Mystic Arts",
                        },
                        {
                            name: "Storm",
                            role: "Area Control",
                            image: "storm.png",
                            description:
                                "Mutant with weather manipulation powers",
                        },
                        {
                            name: "Magneto",
                            role: "Tank",
                            image: "magneto.png",
                            description:
                                "Master of magnetism and mutant revolutionary",
                        },
                        {
                            name: "Star-Lord",
                            role: "Damage",
                            image: "starlord.png",
                            description:
                                "Leader of the Guardians of the Galaxy",
                        },
                    ];
                }
                break;

            case "Overwatch 2":
                try {
                    // Using a community API for Overwatch
                    const url = "https://overfast-api.tekrop.fr/heroes";
                    console.log(`Fetching Overwatch 2 data from: ${url}`);

                    const { data } = await axios.get(url);

                    characters = data.map((hero) => ({
                        name: hero.name,
                        role: hero.role,
                        image: `${hero.key}.png`,
                        description:
                            hero.description ||
                            `An ${hero.role} hero in Overwatch 2`,
                    }));

                    console.log(
                        `Successfully retrieved ${characters.length} Overwatch 2 heroes`
                    );
                } catch (e) {
                    console.error(
                        "\x1b[31m%s\x1b[0m",
                        `ERROR: Overwatch API fetch failed: ${e.message}`
                    );
                    characters = [
                        {
                            name: "Tracer",
                            role: "Damage",
                            image: "tracer.png",
                            description:
                                "A former Overwatch agent with time-manipulation abilities",
                        },
                        {
                            name: "Reinhardt",
                            role: "Tank",
                            image: "reinhardt.png",
                            description:
                                "A decorated German soldier who lives by the knightly codes",
                        },
                        {
                            name: "Mercy",
                            role: "Support",
                            image: "mercy.png",
                            description:
                                "A brilliant doctor and first responder",
                        },
                        {
                            name: "Genji",
                            role: "Damage",
                            image: "genji.png",
                            description:
                                "A cybernetic ninja with incredible agility",
                        },
                    ];
                }
                break;

            default:
                console.error(
                    "\x1b[31m%s\x1b[0m",
                    `ERROR: Unknown game: ${game}`
                );
                characters = [];
        }

        return characters;
    } catch (error) {
        console.error(
            "\x1b[31m%s\x1b[0m",
            `CRITICAL ERROR fetching characters for ${game}: ${error.message}`
        );
        console.error(error.stack);

        // Return empty array as last resort
        return [];
    }
}

async function seedGames() {
    const gamesCollection = await games();

    // Clear existing data
    await gamesCollection.deleteMany({});

    // Define base game data
    const gamesList = [
        {
            name: "League of Legends",
            genre: "MOBA",
            platforms: ["PC"],
            characters: [],
        },
        {
            name: "Valorant",
            genre: "FPS",
            platforms: ["PC"],
            characters: [],
        },
        {
            name: "Marvel Rivals",
            genre: "Hero Shooter",
            platforms: ["PC", "PlayStation", "Xbox"],
            characters: [],
        },
        {
            name: "Teamfight Tactics",
            genre: "Auto Battler",
            platforms: ["PC", "Mobile"],
            characters: [],
        },
        {
            name: "Overwatch 2",
            genre: "Hero Shooter",
            platforms: [
                "Battlenet",
                "PC",
                "PlayStation",
                "Xbox",
                "Nintendo Switch",
            ],
            characters: [],
        },
    ];

    // Fetch character data for each game
    for (let game of gamesList) {
        console.log(`Fetching character data for ${game.name}...`);
        game.characters = await fetchCharacterDetails(game.name);
        console.log(
            `Got ${game.characters.length} characters for ${game.name}`
        );
    }

    await gamesCollection.insertMany(gamesList);
    console.log("Game data seeded successfully");

    return gamesList;
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

    // Get character names from game data for more realistic posts
    const getRandomCharacter = (gameName) => {
        const game = gameData.find((g) => g.name === gameName);
        if (game && game.characters && game.characters.length > 0) {
            const randomIndex = Math.floor(
                Math.random() * game.characters.length
            );
            return game.characters[randomIndex].name;
        }
        return null;
    };

    // Create posts for League of Legends
    const lolChars =
        gameData.find((g) => g.name === "League of Legends")?.characters || [];

    if (lolChars.length > 0) {
        // Use some actual characters from the fetched data
        postData.push({
            userId: user1._id.toString(),
            username: user1.username,
            game: "League of Legends",
            character: lolChars[0].name,
            title: `Best ${lolChars[0].name} build for season 14`,
            body: `I've been trying different builds for ${lolChars[0].name} in season 14, and here's what I found most effective...`,
            tags: ["strategy", "build", lolChars[0].role.toLowerCase()],
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
        // Fallback to hardcoded content
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
    const valorantChars =
        gameData.find((g) => g.name === "Valorant")?.characters || [];

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
    const marvelChars =
        gameData.find((g) => g.name === "Marvel Rivals")?.characters || [];

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
    const owChars =
        gameData.find((g) => g.name === "Overwatch 2")?.characters || [];

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
