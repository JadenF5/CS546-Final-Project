import express from "express";
import { posts, users } from "../config/mongoCollections.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const { query, type, game, postType } = req.query;

    try {
        if (type === "users") {
            const usersCollection = await users();
            const matchedUsers = await usersCollection
                .find({ username: { $regex: query, $options: "i" } })
                .toArray();
            return res.render("searchResults", {
                title: "User Search Results",
                users: matchedUsers,
                posts: [],
            });
        } else {
            const postsCollection = await posts();
            const filter = {
                title: { $regex: query, $options: "i" },
            };
            if (game) filter.game = game;
            if (postType) filter.type = postType;

            const matchedPosts = await postsCollection.find(filter).toArray();
            return res.render("searchResults", {
                title: "Post Search Results",
                posts: matchedPosts,
                users: [],
            });
        }
    } catch (e) {
        console.error("Search error:", e);
        res.status(500).render("error", {
            title: "Search Error",
            error: "Something went wrong during your search.",
        });
    }
});

export default router;
