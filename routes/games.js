import express from "express";
import { ObjectId } from "mongodb";
import { requireLogin } from "../middleware/auth.js";
import { games, posts, users } from "../config/mongoCollections.js";
import {
    getLeagueCharacters,
    getValorantAgents,
    getMarvelRivalsCharacters,
    getTFTChampions,
    getOverwatch2Heroes,
} from "../services/gameApi.js";

const router = express.Router();

router.get("/games/:gameName", requireLogin, async (req, res) => {
    try {
        const gameName = req.params.gameName;
        const gamesCollection = await games();
        const game = await gamesCollection.findOne({ name: gameName });

        if (!game) {
            return res.status(404).render("error", {
                title: "Error",
                error: "Game not found",
            });
        }

        const user = req.session.user;
        const isFavorite = user.selectedGames?.includes(gameName);

        const postsCollection = await posts();
        const gamePosts = await postsCollection
            .find({ game: gameName })
            .sort({ pinned: -1, timestamp: -1 })
            .toArray();
        let charactersWithImages = [];

        if (["League of Legends", "Valorant", "Marvel Rivals", "Teamfight Tactics", "Overwatch 2"].includes(gameName)) {
            const dbCharacters = game.characters;
            let apiCharacters = [];

            try {
                switch (gameName) {
                    case "League of Legends":
                        apiCharacters = await getLeagueCharacters(true);
                        break;
                    case "Valorant":
                        apiCharacters = await getValorantAgents(true);
                        break;
                    case "Marvel Rivals":
                        apiCharacters = await getMarvelRivalsCharacters(true);
                        break;
                    case "Teamfight Tactics":
                        apiCharacters = await getTFTChampions(true);
                        break;
                    case "Overwatch 2":
                        apiCharacters = await getOverwatch2Heroes(true);
                        break;
                }
            } catch (e) {
                console.warn(`API fallback for ${gameName}:`, e);
            }

            charactersWithImages = dbCharacters.map((char) => {
                const match = apiCharacters.find(
                    (apiChar) => apiChar.name.toLowerCase() === char.name.toLowerCase()
                );
                return {
                    name: char.name,
                    role: char.role,
                    imageUrl: match?.imageUrl || "",
                    description: char.description,
                };
            });
        } else {
            charactersWithImages = game.characters.map((char) => ({
                name: char.name,
                role: char.role,
                imageUrl: "",
                description: char.description,
            }));
        }
        const gameData = {
            ...game,
            charactersWithImages: charactersWithImages,
        };

        res.render("game", {
            title: game.name,
            game: { ...game, charactersWithImages },
            gamePosts,
            user,
            isFavorite,
        });
    } catch (e) {
        console.error("Game page error:", e);
        res.status(500).render("error", {
            title: "Error",
            error: "An error occurred loading the game page",
        });
    }
});

// Add API route for adding a game to favorites
router.post("/api/games/favorite", requireLogin, async (req, res) => {
    try {
        const { gameName } = req.body;
        const userId = req.session.user._id;

        const userCollection = await users();
        const user = await userCollection.findOne({
            _id: new ObjectId(userId),
        });

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        let selectedGames = user.selectedGames || [];
        if (!selectedGames.includes(gameName)) {
            selectedGames.push(gameName);

            await userCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { selectedGames: selectedGames } }
            );

            req.session.user.selectedGames = selectedGames;

            return res.json({ success: true });
        }

        return res.json({
            success: false,
            message: "Game already in favorites",
        });
    } catch (e) {
        console.error("Add favorite game error:", e);
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
});

// Add API route for removing a game from favorites
router.delete("/api/games/favorite", requireLogin, async (req, res) => {
    try {
        const { gameName } = req.body;
        const userId = req.session.user._id;

        const userCollection = await users();
        const user = await userCollection.findOne({
            _id: new ObjectId(userId),
        });

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        let selectedGames = user.selectedGames || [];
        selectedGames = selectedGames.filter((g) => g !== gameName);

        await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { selectedGames: selectedGames } }
        );

        req.session.user.selectedGames = selectedGames;

        return res.json({ success: true });
    } catch (e) {
        console.error("Remove favorite game error:", e);
        return res
            .status(500)
            .json({ success: false, message: "Server error" });
    }
});

export default router;
