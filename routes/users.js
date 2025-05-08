import express from "express";
import { ObjectId } from "mongodb";
import { users, posts, games } from "../config/mongoCollections.js";
import { requireLogin } from "../middleware/auth.js";
import xss from "xss";

const router = express.Router();

// GET: Edit profile
router.get("/profile/edit", requireLogin, async (req, res) => {
    try {
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
        if (!user) throw "User not found";

        const allPlatforms = ["PC", "PlayStation", "Xbox", "Mobile"];
        const gamesCollection = await games();
        const allGames = await gamesCollection.find({}).toArray();

        const privacyFields = [
            { key: "profilePublic", label: "your profile" },
            { key: "showBio", label: "your bio" },
            { key: "showCharacters", label: "your characters" },
            { key: "showPosts", label: "your posts" },
            { key: "showAchievements", label: "your achievements" }
        ];

        res.render("editProfile", {
            title: "Edit Your Profile",
            user,
            allPlatforms,
            allGames,
            privacyFields
        });
    } catch (e) {
        return res.status(500).render("error", {
            title: "Error",
            error: typeof e === "string" ? e : "Could not load profile editor."
        });
    }
});

// GET: View a user's profile
router.get("/profile/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        if (!ObjectId.isValid(userId)) {
            console.error("Invalid ObjectId passed to /profile/:id:", userId);
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid user ID format provided."
            });
        }

        const userCollection = await users();
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) throw "User not found";

        const isOwner = req.session.user && req.session.user._id === userId;
        const privacy = user.privacySettings ?? {};

        // Enforce privacy
        if (!isOwner && privacy.profilePublic === false) {
            return res.status(403).render("error", {
                title: "Private Profile",
                error: "This user’s profile is private.",
            });
        }

        let userPosts = [];
        if (isOwner || privacy.showPosts) {
            const postsCollection = await posts();
            userPosts = await postsCollection.find({ userId }).toArray();
        }

        res.render("profile", {
            title: `${user.username}'s Profile`,
            user,
            isOwner,
            posts: userPosts,
            visible: {
                bio: isOwner || privacy.showBio,
                characters: isOwner || privacy.showCharacters,
                achievements: isOwner || privacy.showAchievements,
                posts: isOwner || privacy.showPosts,
            },
        });
    } catch (e) {
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
                error: "Invalid user ID format provided."
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
            privacy_showAchievements
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
                showAchievements: privacy_showAchievements === "true" || false
            }
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
            error: typeof e === "string" ? e : "Could not update your profile."
        });
    }
});


export default router;
