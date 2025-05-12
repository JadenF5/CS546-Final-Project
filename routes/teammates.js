import express from "express";
import { teammatePosts, users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { requireLogin } from "../middleware/auth.js";

const router = express.Router();

//Showing all of the teammate posts
router.get("/", requireLogin, async (req, res) => {
    const collection = await teammatePosts();
    const posts = await collection.find({}).sort({ timestamp: -1 }).toArray();

    const userId = req.session.user._id;
    posts.forEach(post => {
        post.isOwner = post.userId.toString() === userId.toString();
    });

    res.render("teammates", {title: "Looking for Teammates", posts, deleted: req.query.deleted === "true"});
});

//Showing the create form.
router.get("/new", requireLogin, (req, res) => {
    res.render("newTeammatePost", {title: "Create a post"});
});


//Posting the post/submitting the form.
router.post("/new", requireLogin, async (req, res) => {
    const {game, preferences, region, rank, platform, availability, message} = req.body;
    const userId = req.session.user._id;

    const usersCollection = await users();
    const user = await usersCollection.findOne({_id: new ObjectId (userId)});

    const newPost = {
        userId: userId,
        username: user.username,
        game,
        preferences: Array.isArray(preferences) ? preferences : [preferences],
        region,
        rank,
        platform,
        availability,
        message,
        timestamp: new Date().toISOString()
    };

    if (!message || message.trim().length === 0) {
        return res.status(400).render("error", {
          title: "Error",
          error: "Message is required."
        });
    }
      if (message.length > 1000) {
        return res.status(400).render("error", {
          title: "Message Too Long",
          error: "Your message is too long; please keep it under 1 000 characters."
        });
    }

    const collection = await teammatePosts();
    await collection.insertOne(newPost);

    res.redirect("/teammates");
});


//deleting a post
router.post("/delete", async (req, res) => {
    try{
        const userId = req.session.user._id;
        const {postId} = req.body;

        if (!ObjectId.isValid(postId)){
            return res.status(400).render("error", { error: "Invalid post ID." });
        }

        const collection = await teammatePosts();
        const post = await collection.findOne({_id: new ObjectId(postId)});


        if (!post){
            return res.status(404).render("error", { error: "Post not found. "});
        }

        if (post.userId.toString() !== userId.toString()){
            return res.status(403).render("error", { error: "Unauthorized request."});
        }

        await collection.deleteOne({_id: new ObjectId(postId)});
        res.redirect("/teammates?deleted=true");
    }

    catch (e){
        res.status(500).render("error", { error: "An error occurred while deleting the post." });
    }
})

export default router;
