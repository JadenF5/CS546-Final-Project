import express from "express";
import { ObjectId } from "mongodb";
import { posts } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";

const router = express.Router();

// GET: View a single post and its comments
router.get("/posts/:postId", requireLogin, async (req, res) => {
    try {
        const postId = req.params.postId;

        const postsCollection = await posts();
        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

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
        console.error("Error fetching post:", e);
        res.status(500).render("error", {
            title: "Error",
            error: "Failed to load post.",
        });
    }
});

// POST: Submit a reply to a post
router.post("/posts/:postId/reply", requireLogin, async (req, res) => {
    try {
        const postId = req.params.postId;
        const commentText = req.body.comment?.trim();

        if (!commentText) {
            return res.status(400).render("error", { title: "Error", error: "Comment cannot be empty." });
        }

        const postsCollection = await posts();
        const newComment = {
            _id: new ObjectId().toString(),
            userId: req.session.user._id,
            username: req.session.user.username,
            comment: commentText,
            timestamp: new Date().toISOString(),
        };

        const updateResult = await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: newComment } }
        );

        if (updateResult.modifiedCount === 0) {
            throw "Failed to add comment.";
        }

        res.redirect(`/posts/${postId}`);
    } catch (e) {
        console.error("Error submitting reply:", e);
        res.status(500).render("error", {
            title: "Error",
            error: "Could not submit reply.",
        });
    }
});


export default router;
