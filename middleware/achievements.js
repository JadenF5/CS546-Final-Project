import { users } from "../config/mongoCollections.js";
import { awardAchievement } from "../helpers/achievements.js";
import { ObjectId } from "mongodb";

export async function checkLoyalMember(req, res, next) {
    if (!req.session.user) return next();

    try {
        const userIdStr = req.session.user._id;
        if (!ObjectId.isValid(userIdStr)) return next();

        const userId = new ObjectId(userIdStr);
        const usersCollection = await users();
        const user = await usersCollection.findOne({ _id: userId });
        if (!user || !user.createdAt) return next();

        const createdDate = new Date(user.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

        if (diffDays >= 30) {
            await awardAchievement(userId, "Loyal Member", usersCollection);
        }
    } catch (e) {
        console.error("Error checking 'Loyal Member':", e);
    }

    next();
}
