import express from "express";
import { ObjectId } from "mongodb";
import { users, posts, games } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";
import xss from "xss";
import {
    getLeagueCharacters,
    getValorantAgents,
    getMarvelRivalsCharacters,
    getTFTChampions,
    getOverwatch2Heroes,
} from "../services/gameApi.js";

const router = express.Router();

router.get("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        if (!ObjectId.isValid(userId)) {
            console.error("Invalid ObjectId passed to /profile/:id:", userId);
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid user ID format provided.",
            });
        }

        // Get user first
        const userCollection = await users();
        const user = await userCollection.findOne(
            {
                _id: new ObjectId(userId),
            },
            {
                projection: {
                    hashedPassword: 0, 
                },
            }
        );

        if (!user) {
            return res.status(404).render("error", {
                title: "Not Found",
                error: "User not found.",
            });
        }

        const isOwner =
            req.session.user &&
            req.session.user._id.toString() === userId.toString();
        const privacy = user.privacySettings ?? {};

        if (!isOwner && privacy.profilePublic === false) {
            return res.status(403).render("error", {
                title: "Private Profile",
                error: "This user's profile is private.",
            });
        }

        let userPosts = [];
        if (isOwner || privacy.showPosts) {
            const postsCollection = await posts();
            userPosts = await postsCollection
                .find({ userId })
                .limit(10) 
                .sort({ timestamp: -1 })
                .toArray();
        }

        const characterImages = {};

        if (
            (!isOwner && !privacy.showCharacters) ||
            !user.selectedGames ||
            user.selectedGames.length === 0 ||
            !user.favoriteCharacters ||
            Object.keys(user.favoriteCharacters).length === 0
        ) {
            return res.render("profile", {
                title: `${user.username}'s Profile`,
                user,
                isOwner,
                posts: userPosts,
                characterImages: characterImages,
                visible: {
                    bio: isOwner || privacy.showBio,
                    characters: isOwner || privacy.showCharacters,
                    achievements: isOwner || privacy.showAchievements,
                    posts: isOwner || privacy.showPosts,
                },
            });
        }

        let gamesWithChars = user.selectedGames.filter(
            (game) =>
                user.favoriteCharacters[game] &&
                user.favoriteCharacters[game].length > 0
        );

        if (gamesWithChars.length === 0) {
            return res.render("profile", {
                title: `${user.username}'s Profile`,
                user,
                isOwner,
                posts: userPosts,
                characterImages: characterImages,
                visible: {
                    bio: isOwner || privacy.showBio,
                    characters: isOwner || privacy.showCharacters,
                    achievements: isOwner || privacy.showAchievements,
                    posts: isOwner || privacy.showPosts,
                },
            });
        }

        let processedGames = 0;

        const processNextGame = async (index) => {
            if (index >= gamesWithChars.length) {
                return res.render("profile", {
                    title: `${user.username}'s Profile`,
                    user,
                    isOwner,
                    posts: userPosts,
                    characterImages: characterImages,
                    visible: {
                        bio: isOwner || privacy.showBio,
                        characters: isOwner || privacy.showCharacters,
                        achievements: isOwner || privacy.showAchievements,
                        posts: isOwner || privacy.showPosts,
                    },
                });
            }

            const game = gamesWithChars[index];

            try {
                let gameCharacters = [];

                switch (game) {
                    case "League of Legends":
                        gameCharacters = await getLeagueCharacters(true);
                        break;
                    case "Valorant":
                        gameCharacters = await getValorantAgents(true);
                        break;
                    case "Marvel Rivals":
                        gameCharacters = await getMarvelRivalsCharacters(true);
                        break;
                    case "Teamfight Tactics":
                        gameCharacters = await getTFTChampions(true);
                        break;
                    case "Overwatch 2":
                        gameCharacters = await getOverwatch2Heroes(true);
                        break;
                    default:
                        gameCharacters = [];
                }

                characterImages[game] = [];
                for (const charName of user.favoriteCharacters[game]) {
                    const characterData = gameCharacters.find(
                        (c) => c.name === charName
                    );

                    if (characterData) {
                        characterImages[game].push({
                            name: charName,
                            role: characterData.role || "Unknown",
                            imageUrl: characterData.imageUrl || "",
                            description: characterData.description || "",
                        });
                    } else {
                        characterImages[game].push({
                            name: charName,
                            role: "Unknown",
                            imageUrl: "",
                            description: `A character in ${game}`,
                        });
                    }
                }
            } catch (error) {
                console.error(`Error fetching characters for ${game}:`, error);
                characterImages[game] = user.favoriteCharacters[game].map(
                    (charName) => ({
                        name: charName,
                        role: "Unknown",
                        imageUrl: "",
                        description: `A character in ${game}`,
                    })
                );
            }

            await processNextGame(index + 1);
        };

        await processNextGame(0);
    } catch (e) {
        console.error("Profile loading error:", e);
        return res.status(500).render("error", {
            title: "Error",
            error: typeof e === "string" ? e : "Failed to load profile",
        });
    }
});

export default router;
