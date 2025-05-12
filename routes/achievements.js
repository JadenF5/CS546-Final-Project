import express from "express";
import { ObjectId } from "mongodb";
import { users, posts } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";
import { achievementCatalog, awardAchievement } from "../helpers/achievements.js";

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

  // grab your collections
  const usersCol = await users();
  const postsCol = await posts();

  const user = await usersCol.findOne({ _id: userId });
  if (!user) { 
    return res.status(404).render("error", {
        title: "User Not Found",
        error: "We couldn't find your user account."
    });
  }

  // 0) Loyal Member: been around >=30 days?
  if (user.createdAt) {
    const created = new Date(user.createdAt);
    const daysAlive = Math.floor( (Date.now() - created.getTime()) / (1000*60*60*24) );
    if (daysAlive >= 30) {
      await awardAchievement(userId, "Loyal Member", usersCol);
    }
  }

  // 1) count their posts
  const postCount = await postsCol.countDocuments({
    $or: [
      { userId: userId },      
      { userId: userIdStr }     
    ]
  });
  if (postCount >= 10) {
    await awardAchievement(userId, "Clip Professional", usersCol);
  }

  // 2) sum up all their likes across posts
  const [likesAgg] = await postsCol.aggregate([
    { $match: { userId: userIdStr } },
    { $group: { _id: null, totalLikes: { $sum: "$likes" } } }
  ]).toArray();
  const totalLikes = likesAgg?.totalLikes || 0;
  if (totalLikes >= 50) {
    await awardAchievement(userId, "Famous", usersCol);
  }

  // now re-fetch the user so we see any newly-awarded badges
  const fresh = await usersCol.findOne({ _id: userId });
  if (!fresh) {
    return res.status(404).render("error", {
      title: "User Not Found",
      error: "We couldn't find your user account."
    });
  }

  // prepare for rendering
  const userAchievements = (fresh.achievements || []).map(a => a.name);
  const earnedMap = {};
  for (const a of fresh.achievements || []) {
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
