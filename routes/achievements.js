import express from "express";
import { users } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";
import { ObjectId } from "mongodb";
import { achievementCatalog } from "../helpers/achievements.js";

const router = express.Router();
  

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
