import express from "express";
import { ObjectId } from "mongodb";
import { requireLogin } from "../middleware/auth.js";
import { games, posts, users } from "../config/mongoCollections.js";

const router = express.Router();

router.get("/threads/:gameName/:characterName", requireLogin, async (req, res) => {
    try {
        const { gameName, characterName } = req.params;
        const sortOption = req.query.sort || "latest";

        const gamesCollection = await games();
        const postsCollection = await posts();

        const game = await gamesCollection.findOne({ name: gameName });
        if (!game) {
            return res.status(404).render("error", {
                title: "Error",
                error: "Game not found",
            });
        }

        // Build sorting logic
        let sortCriteria;
        if (sortOption === "liked") {
            sortCriteria = { likes: -1 };
        } else if (sortOption === "all") {
            sortCriteria = { _id: 1 }; // chronological order (oldest first)
        } else {
            sortCriteria = { timestamp: -1 }; // default: latest
        }

        const threads = await postsCollection
            .find({ game: gameName, character: characterName })
            .sort(sortCriteria)
            .toArray();

        res.render("threads", {
            title: `${characterName} Threads - ${gameName}`,
            gameName,
            character: characterName,
            threads,
            sort: sortOption, // for dropdown selection
        });
    } catch (e) {
        console.error("Character thread view error:", e);
        res.status(500).render("error", {
            title: "Error",
            error: "Could not load character threads",
        });
    }
});


export default router;
