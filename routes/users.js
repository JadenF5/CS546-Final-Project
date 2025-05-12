import express from "express";
import { ObjectId } from "mongodb";
import { users, posts, games } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";
import xss from "xss";
import { achievementCatalog } from "../helpers/achievements.js";
import {
    getLeagueCharacters,
    getValorantAgents,
    getMarvelRivalsCharacters,
    getTFTChampions,
    getOverwatch2Heroes,
} from "../services/gameApi.js";

const router = express.Router();

// GET: Edit profile
router.get("/profile/edit", requireLogin, async (req, res) => {
    try {
        const userIdStr = req.session.user._id;

        if (!ObjectId.isValid(userIdStr)) {
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid user ID format provided.",
            });
        }

        const userId = new ObjectId(userIdStr);
        const userCollection = await users();
        const user = await userCollection.findOne({ _id: userId });
        if (!user) throw "User not found";

        const allPlatforms = ["PC", "PlayStation", "Xbox", "Mobile"];
        const gamesCollection = await games();
        const allGames = await gamesCollection.find({}).toArray();

        const privacyFields = [
            { key: "profilePublic", label: "your profile" },
            { key: "showBio", label: "your bio" },
            { key: "showCharacters", label: "your characters" },
            { key: "showPosts", label: "your posts" },
            { key: "showAchievements", label: "your achievements" },
        ];

        res.render("editProfile", {
            title: "Edit Your Profile",
            user,
            allPlatforms,
            allGames,
            privacyFields,
        });
    } catch (e) {
        return res.status(500).render("error", {
            title: "Error",
            error: typeof e === "string" ? e : "Could not load profile editor.",
        });
    }
});

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

        const achievementEmojis = {};
        for (const a of achievementCatalog) {
            achievementEmojis[a.name] = { emoji: a.emoji };
        }

        if (user.achievements && Array.isArray(user.achievements)) {
            user.achievements = user.achievements.map((a) => ({
                ...a,
                earnedOn: new Date(a.earnedOn).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            }));
        }

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
                .find({
                    $or: [{ userId: userId }, { userId: new ObjectId(userId) }],
                })
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
                achievementEmojis,
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
                achievementEmojis,
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
                    achievementEmojis,
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
                        (c) => c.name.toLowerCase() === charName.toLowerCase()
                    );
                    if (characterData) {
                        characterImages[game].push({
                            name: charName,
                            role: characterData.role || "Unknown",
                            imageUrl: characterData.imageUrl || "",
                            description: characterData.description || "",
                        });
                    } else {
                        let imageUrl = "";
                        if (game === "Marvel Rivals") {
                            const heroNameForUrl = charName
                                .toLowerCase()
                                .replace(/\s+/g, "");
                            imageUrl = `https://marvelrivalsapi.com/rivals/heroes/card/${heroNameForUrl}.png`;
                            console.log(
                                `Fallback Marvel Rivals URL for ${charName}: ${imageUrl}`
                            );
                        }
                        characterImages[game].push({
                            name: charName,
                            role: "Unknown",
                            imageUrl: imageUrl,
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

// POST: Submit profile edits
router.post("/profile/edit", requireLogin, async (req, res) => {
    try {
        const userIdStr = req.session.user._id;

        if (!ObjectId.isValid(userIdStr)) {
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid user ID format provided.",
            });
        }

        const userId = new ObjectId(userIdStr);
        const userCollection = await users();
        const user = await userCollection.findOne({ _id: userId });
        if (!user) throw "User not found";

        const {
            bio,
            platforms,
            selectedGames,
            favoriteCharacters,
            privacy_profilePublic,
            privacy_showBio,
            privacy_showCharacters,
            privacy_showPosts,
            privacy_showAchievements,
        } = req.body;

        const updates = {
            bio: xss(bio ?? user.bio),
            platforms: platforms
                ? Array.isArray(platforms)
                    ? platforms.map(xss)
                    : [xss(platforms)]
                : user.platforms ?? [],

            selectedGames: selectedGames
                ? Array.isArray(selectedGames)
                    ? selectedGames.map(xss)
                    : [xss(selectedGames)]
                : user.selectedGames ?? [],

            favoriteCharacters: {},
            privacySettings: {
                profilePublic: privacy_profilePublic === "true" || false,
                showBio: privacy_showBio === "true" || false,
                showCharacters: privacy_showCharacters === "true" || false,
                showPosts: privacy_showPosts === "true" || false,
                showAchievements: privacy_showAchievements === "true" || false,
            },
        };

        // Parse favoriteCharacters (format: "Game:Character")
        if (favoriteCharacters) {
            const charEntries = Array.isArray(favoriteCharacters)
                ? favoriteCharacters
                : [favoriteCharacters];

            for (const entry of charEntries) {
                const [game, character] = entry.split(":");
                if (!updates.favoriteCharacters[game]) {
                    updates.favoriteCharacters[game] = [];
                }
                updates.favoriteCharacters[game].push(xss(character));
            }
        } else {
            updates.favoriteCharacters = user.favoriteCharacters ?? {};
        }

        await userCollection.updateOne({ _id: userId }, { $set: updates });
        res.redirect(`/profile/${userIdStr}`);
    } catch (e) {
        return res.status(500).render("error", {
            title: "Update Failed",
            error: typeof e === "string" ? e : "Could not update your profile.",
        });
    }
});

router.get("/find", requireLogin, async (req, res) => {
    const userId = req.session.user._id;
    const userCollection = await users();
    const currentUser = await userCollection.findOne({
        _id: new ObjectId(userId),
    });

    const allUsers = await userCollection
        .find({ _id: { $ne: new ObjectId(userId) } })
        .project({ _id: 1, username: 1 })
        .toArray();

    // Remove users already in friend list
    const filtered = allUsers.filter(
        (u) => !currentUser.friends.includes(u._id.toString())
    );

    res.render("findFriends", {
        title: "Find Friends",
        users: filtered,
    });
});

export default router;
