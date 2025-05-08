import express from "express";
import { users } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";
import { ObjectId } from "mongodb";

const router = express.Router();

const achievementCatalog = [
    { name: "First Sign Up!", description: "You registered your account." },
    { name: "First Post!", description: "You made your first post." },
    { name: "Clip Professional", description: "Posted 10 threads." },
    { name: "Famous", description: "Received 50 likes across posts." },
    { name: "Loyal Member", description: "Been active for 30 days." }
];

router.get("/achievements", requireLogin, async (req, res) => {
    const userIdStr = req.session.user._id;

    if (!ObjectId.isValid(userIdStr)) {
        return res.status(400).render("error", {
            title: "Invalid ID",
            error: "Invalid user ID format provided."
        });
    }

    const userId = new ObjectId(userIdStr);
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: userId });

    if (!user) {
        return res.status(404).render("error", {
            title: "User Not Found",
            error: "We couldn't find your user account."
        });
    }

    const userAchievements = (user.achievements || []).map((a) => a.name);
    const earnedMap = {};
    for (const a of user.achievements || []) {
        earnedMap[a.name] = a.earnedOn;
    }

    res.render("achievements", {
        title: "Your Achievements",
        allAchievements: achievementCatalog,
        userAchievements,
        earnedMap
    });
});



export default router;
