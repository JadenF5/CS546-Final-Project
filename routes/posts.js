import express from "express";
import { ObjectId } from "mongodb";
import { requireLogin } from "../middleware/auth.js";
import { posts } from "../config/mongoCollections.js";
import * as postData from "../data/post.js";
import { users } from "../config/mongoCollections.js";
import { awardAchievement } from "../helpers/achievements.js";

const router = express.Router();

router.get("/posts/new", requireLogin, async (req, res) => {
    const { game, character } = req.query;

    if (!game) {
        return res.status(400).render("error", { title: "Error", error: "Game is required." });
    }

    res.render("newPost", {
        title: "Create New Thread",
        game,
        character: character || null,
        user: req.session.user,
    });
});

router.post("/posts/new", requireLogin, async (req, res) => {
    const { title, body, game, character } = req.body;

    if (!title || !body || !game) {
        return res.status(400).render("error", {
            title: "Error",
            error: "Title, game, and body are required.",
        });
    }

    try {
        const postsCollection = await posts();
        const userCollection = await users();
        const userId = new ObjectId(req.session.user._id);
        const newPost = {
            userId,
            username: req.session.user.username,
            game,
            character: character || null,
            title,
            body,
            tags: [],
            media: [],
            likes: 0,
            likedBy: [],
            comments: [],
            pinned: false,
            timestamp: new Date().toISOString(),
        };

        const insertResult = await postsCollection.insertOne(newPost);
        const userPostCount = await postsCollection.countDocuments({ userId });
        await awardAchievement(userId, "First Post!", userCollection);
        if (userPostCount >= 10) {
            await awardAchievement(userId, "Clip Professional", userCollection);
        }
        const postId = insertResult.insertedId;

        if (character) {
            return res.redirect(`/threads/${game}/${character}`);
        } else {
            return res.redirect(`/games/${game}`);
        }
    } catch (err) {
        return res.status(500).render("error", {
            title: "Error",
            error: "Could not insert post.",
        });
    }
});

router.get("/posts/:postId", requireLogin, async (req, res) => {
    try {
        const post = await postData.getPostById(req.params.postId);
        if (!post) {
            return res.status(404).render("error", {
                title: "Post Not Found",
                error: "The post you're looking for does not exist.",
            });
        }

        res.render("post", {
            title: post.title,
            post,
        });
    } catch (e) {
        res.status(500).render("error", {
            title: "Error",
            error: "Failed to load post.",
        });
    }
});

router.post("/posts/:postId/reply", requireLogin, async (req, res) => {
    try {
        const commentText = req.body.comment?.trim();
        if (!commentText) {
            return res.status(400).render("error", {
                title: "Error",
                error: "Comment cannot be empty.",
            });
        }

        const newComment = {
            _id: new ObjectId().toString(),
            userId: req.session.user._id,
            username: req.session.user.username,
            comment: commentText,
            timestamp: new Date().toISOString(),
        };

        await postData.addCommentToPost(req.params.postId, newComment);
        res.redirect(`/posts/${req.params.postId}`);
    } catch (e) {
        res.status(500).render("error", {
            title: "Error",
            error: "Could not submit reply.",
        });
    }
});

router.post("/posts/:postId/like", requireLogin, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.session.user._id;

        await postData.toggleLike(postId, userId);
        const postsCollection = await posts();
        const usersCollection = await users();

        const userPosts = await postsCollection.find({ userId }).toArray();
        const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes || 0), 0);

        if (totalLikes >= 50) {
            await awardAchievement(userId, "Famous", usersCollection);
        }

        res.redirect(`/posts/${postId}`);
    } catch (e) {
        res.status(500).render("error", {
            title: "Error",
            error: "Failed to update like status.",
        });
    }
});

export default router;
