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
        const isFavorite =
            user.selectedGames && user.selectedGames.includes(gameName);

        const postsCollection = await posts();
        const gamePosts = await postsCollection
            .find({ game: gameName })
            // pinned threads first, then newest first
            .sort({ pinned: -1, timestamp: -1 })
            .toArray();
        let charactersWithImages = [];
        try {
            switch (gameName) {
                case "League of Legends":
                    charactersWithImages = await getLeagueCharacters(
                        true
                    ).catch((e) => []);
                    break;
                case "Valorant":
                    charactersWithImages = await getValorantAgents(true).catch(
                        (e) => []
                    );
                    break;
                case "Marvel Rivals":
                    charactersWithImages = await getMarvelRivalsCharacters(
                        true
                    ).catch((e) => []);
                    break;
                case "Teamfight Tactics":
                    charactersWithImages = await getTFTChampions(true).catch(
                        (e) => []
                    );
                    break;
                case "Overwatch 2":
                    charactersWithImages = await getOverwatch2Heroes(
                        true
                    ).catch((e) => []);
                    break;
                default:
                    charactersWithImages = game.characters.map((char) => ({
                        name: char.name,
                        role: char.role,
                        imageUrl: "",
                        description: char.description,
                    }));
            }
        } catch (e) {
            console.error(`Error fetching ${gameName} character images:`, e);
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
            game: gameData,
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
