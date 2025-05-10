import { games } from "../config/mongoCollections.js";
import axios from "axios";

async function fetchCharacterDetails(game) {
    try {
        let characters = [];

        switch (game) {
            case "League of Legends":
                try {
                    const version = "14.9.1";
                    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;

                    const { data } = await axios.get(url);

                    characters = Object.values(data.data).map((champ) => ({
                        name: champ.name,
                        role: champ.tags[0] || "Unknown",
                        image: `${champ.id}.png`,
                        description: champ.blurb,
                    }));
                } catch (e) {
                    console.error(
                        `ERROR: League of Legends API fetch failed: ${e.message}`
                    );
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
                } catch (e) {
                    console.error(
                        `ERROR: Valorant API fetch failed: ${e.message}`
                    );
                }
                break;

            case "Teamfight Tactics":
                try {
                    const version = "13.24.1";
                    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champion.json`;
                    console.log(`Fetching TFT data from: ${url}`);

                    const response = await axios.get(url);
                    const champData = response.data.data;

                    characters = Object.values(champData).map((champ) => {
                        let name = champ.name;

                        let role;
                        if (champ.id.includes("TFT")) {
                            const parts = champ.id.split("_");
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
                } catch (e) {
                    console.error(`ERROR: TFT API fetch failed: ${e.message}`);
                }
                break;

            case "Marvel Rivals":
                try {
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

                    characters = response.data.map((hero) => ({
                        name: hero.name,
                        role: hero.role || "Unknown",
                        image: `https://marvelrivalsapi.com${hero.imageUrl}`,
                        description:
                            hero.bio ||
                            hero.description ||
                            `A hero in Marvel Rivals`,
                    }));
                } catch (e) {
                    console.error(
                        `ERROR: Marvel Rivals API fetch failed: ${e.message}`
                    );
                }
                break;

            case "Overwatch 2":
                try {
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
                } catch (e) {
                    console.error(
                        `ERROR: Overwatch API fetch failed: ${e.message}`
                    );
                }
                break;

            default:
                console.error(`ERROR: Unknown game: ${game}`);
                characters = [];
        }

        return characters;
    } catch (error) {
        console.error(
            ` ERROR fetching characters for ${game}: ${error.message}`
        );
        console.error(error.stack);

        return [];
    }
}

export const createGame = async (gameData) => {
    // Input validation
    const gamesCollection = await games();

    const existingGame = await gamesCollection.findOne({ name: gameData.name });
    if (existingGame) {
        throw `Game with name ${gameData.name} already exists`;
    }

    const insertInfo = await gamesCollection.insertOne(gameData);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw "Could not add game";
    }

    return { ...gameData, _id: insertInfo.insertedId };
};

export const getAllGames = async () => {
    const gamesCollection = await games();
    return await gamesCollection.find({}).toArray();
};

export const getGameByName = async (name) => {
    if (!name || typeof name !== "string") {
        throw "Game name must be a non-empty string";
    }

    const gamesCollection = await games();
    const game = await gamesCollection.findOne({ name: name });

    if (!game) {
        throw `No game found with name: ${name}`;
    }

    return game;
};

// Function to initialize games in the database
export const initializeGames = async () => {
    try {
        const gamesCollection = await games();
        const count = await gamesCollection.countDocuments();

        if (count > 0) {
            console.log(
                "Games collection already populated. Skipping initialization."
            );
            return await getAllGames();
        }

        console.log("Initializing games collection...");

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
                platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
                characters: [],
            },
        ];

        // Fetch character data for each game
        for (let game of gamesList) {
            game.characters = await fetchCharacterDetails(game.name);
        }

        // Insert all games at once
        await gamesCollection.insertMany(gamesList);
        console.log("Games data initialized successfully");

        return gamesList;
    } catch (error) {
        console.error("ERROR: Failed to initialize games:", error);
        throw error;
    }
};

export default {
    createGame,
    getAllGames,
    getGameByName,
    initializeGames,
};
