import express from "express";
import { acceptFriendRequest, sendFriendRequest } from "../data/user.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

const router = express.Router();

import { requireLogin } from "../middleware/auth.js"; // make sure this is imported
import { notifications } from "../config/mongoCollections.js";

router.get("/testform", requireLogin, (req, res) => {
  res.render("friendRequest", { title: "Test Friend Request" });
});


router.get("/list", requireLogin, async (req, res) => {
    const userId = req.session.user._id;
    const userCollection = await users();
    const currentUser = await userCollection.findOne({ _id: new ObjectId(userId) });

    // Convert friend IDs to ObjectId
    const friendIds = currentUser.friends.map(id => new ObjectId(id));
    const friendDocs = await userCollection
        .find({ _id: { $in: friendIds } })
        .project({ username: 1, _id: 1 })
        .toArray();

    res.render("findFriends", {
        title: "Find Friends",
        showFriends: true,
        friends: friendDocs,
        removedSuccess: req.query.removed === "true"
    });
});


//Routes for friend requests.
router.post("/request", requireLogin, async (req, res) => {
    const fromUserId = req.session.user._id;
    const { toUsername } = req.body;

    try {
        if (!toUsername || typeof toUsername !== "string") {
            return res.status(400).render("friendRequest", {
                title: "Friend Request",
                error: "Username is required."
            });
        }

        const userCollection = await users();
        const toUser = await userCollection.findOne({ username: toUsername });

        if (!toUser){
            return res.status(404).render("friendRequest", {
                title: "Friend Request",
                error: "User not found."
            });
        }

        const toUserId = toUser._id.toString();

        await sendFriendRequest(fromUserId, toUserId);
        
        return res.render("friendRequest", {
            title: "Send a Friend Request",
            success: true,
        });
    } 
    
    catch (e){
        return res.status(400).render("friendRequest", {
            title: "Friend Request",
            error: e.toString()
        });
    }
});


//Routes to accept friend requests.
router.post("/accept", async (req, res) => {
    const currentUserId = req.session.user._id;
    const { fromUserId } = req.body;
    await acceptFriendRequest(currentUserId, fromUserId);
    res.json({ success: true });
});


//Routes to decline a friend request.
router.post("/decline", async (req, res) => {
    const currentUserId = req.session.user._id;
    const { fromUserId } = req.body;
    const notificationCollection = await notifications();
    await notificationCollection.deleteOne({ type: "friend_request", fromUserId, toUserId: currentUserId });
    res.json( {success: true });
});


//Routes to remove a friend.
router.post("/remove", requireLogin, async (req, res) => {
    const userId = req.session.user._id;
    const { friendId } = req.body;

    const userCollection = await users();
    const notificationCollection = await notifications();

    await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { friends: friendId } }
    );

    await userCollection.updateOne(
        { _id: new ObjectId(friendId) },
        { $pull: { friends: userId } }
    );

    await notificationCollection.deleteMany({
        type: "friend_request",
        $or: [
            { fromUserId: userId, toUserId: friendId },
            { fromUserId: friendId, toUserId: userId }
        ]
    });

    res.redirect("/friends/list?removed=true");
});

export default router;
