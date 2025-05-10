import express from "express";
import { getNotificationsForUser,markNotificationsSeen } from "../data/user.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try{
        const userId = req.session.user._id;
        const notifications = await getNotificationsForUser(userId);
        res.json(notifications);
    } catch (e){
        res.status(500).json({ error: e.toString() });
    }
});

router.get("/view", async (req, res) => {
    if (!req.session.user){
        return res.redirect("/login");
    }

    res.render("notifications", { title: "Notifications" });
})

router.post("/markSeen", async (req, res) => {
    try{
        const userId = req.session.user._id;
        await markNotificationsSeen(userId);
        res.json( {success: true });
    } catch (e){
        res.status(500).json({ error: e.toString() });
    }
});

export default router;
