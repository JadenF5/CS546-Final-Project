import express from "express";
import { ObjectId } from "mongodb";
import { users, posts, games } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", requireLogin, async (req, res) => {
    try {
        const userCollection = await users();
        const user = await userCollection.findOne({
            _id: new ObjectId(req.session.user._id),
        });

        if (!user) {
            return res.status(404).render("error", {
                title: "Error",
                error: "User not found",
            });
        }

        const gamesCollection = await games();
        const allGames = await gamesCollection.find({}).toArray();

        let userGames = [];
        if (user.selectedGames && user.selectedGames.length > 0) {
            userGames = allGames.filter((game) =>
                user.selectedGames.includes(game.name)
            );
        }

        let otherGames = [];
        if (user.selectedGames && user.selectedGames.length > 0) {
            otherGames = allGames.filter(
                (game) => !user.selectedGames.includes(game.name)
            );
        } else {
            otherGames = allGames;
        }

        const postsCollection = await posts();
        const gameThreads = {};

        if (user.selectedGames && user.selectedGames.length > 0) {
            for (const game of user.selectedGames) {
                // Get latest threads for this game
                const gameLatestThreads = await postsCollection
                    .find({ game: game })
                    .sort({ timestamp: -1 })
                    .limit(3) // Show 3 latest posts per game
                    .toArray();

                gameThreads[game] = gameLatestThreads;
            }
        }

        let friends = [];
        if (user.friends && user.friends.length > 0) {
            const friendIds = user.friends
                .map((id) => {
                    try {
                        return new ObjectId(id);
                    } catch (e) {
                        console.error(`Invalid friend ID: ${id}`);
                        return null;
                    }
                })
                .filter((id) => id !== null);

            friends = await userCollection
                .find({ _id: { $in: friendIds } })
                .project({
                    username: 1,
                    selectedGames: 1,
                    bio: 1,
                    favoriteCharacters: 1,
                })
                .toArray();
        }

        const hbsHelpers = {
            lookup: (obj, field) => (obj && obj[field] ? obj[field] : null),
            isSelected: (game, selectedGames) =>
                selectedGames && selectedGames.includes(game),
        };

        res.render("dashboard", {
            title: "Your Dashboard",
            user: user,
            allGames: allGames,
            userGames: userGames,
            otherGames: otherGames,
            gameThreads: gameThreads,
            friends: friends,
            helpers: hbsHelpers,
        });
    } catch (e) {
        console.error("Dashboard error:", e);
        res.status(500).render("error", {
            title: "Error",
            error: "An error occurred while loading your dashboard",
        });
    }
});

export default router;
