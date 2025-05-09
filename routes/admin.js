import express from "express";
import { ObjectId } from "mongodb";
import { games } from "../config/mongoCollections.js";
import { requireLogin, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/admin", requireLogin, requireAdmin, async (req, res) => {
    try {
        const gamesCollection = await games();
        const allGames = await gamesCollection.find({}).toArray();

        res.render("adminGames", {
            title: "Admin Game Management",
            games: allGames,
        });
    } catch (e) {
        console.error("Error loading admin dashboard:", e);
        return res.status(500).render("error", {
            title: "Admin Error",
            error: "Failed to load admin dashboard.",
        });
    }
});
    
// GET: Add new game form
router.get("/admin/games/new", requireLogin, requireAdmin, (req, res) => {
    res.render("addGame", { title: "Add New Game" });
});
    
// POST: Add new game
router.post("/admin/games/new", requireLogin, requireAdmin, async (req, res) => {
    try {
    const { name, genre, platforms, characterNames, characterRoles, characterImages, characterDescriptions } = req.body;
    
    const gameObj = {
        name: name.trim(),
        genre: genre.trim(),
        platforms: Array.isArray(platforms) ? platforms : [platforms],
        characters: [],
    };
    
    if (Array.isArray(characterNames)) {
        for (let i = 0; i < characterNames.length; i++) {
            if (characterNames[i]) {
                gameObj.characters.push({
                    name: characterNames[i],
                    role: characterRoles[i] || "",
                    image: characterImages[i] || "",
                    description: characterDescriptions[i] || "",
                });
            }
        }
    } else if (characterNames) {
        gameObj.characters.push({
            name: characterNames,
            role: characterRoles,
            image: characterImages,
            description: characterDescriptions,
        });
    }

    const gamesCollection = await games();
    await gamesCollection.insertOne(gameObj);
    res.redirect("/admin");
    } catch (e) {
        res.status(500).render("error", {
            title: "Add Game Failed",
            error: e.toString(),
        });
    }
});
    
// GET: Edit game form
router.get("/admin/games/:id/edit", requireLogin, requireAdmin, async (req, res) => {
    const gameId = req.params.id;

        if (!ObjectId.isValid(gameId)) {
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid game ID.",
            });
        }
    
    const gamesCollection = await games();
    const game = await gamesCollection.findOne({ _id: new ObjectId(gameId) });
    
    if (!game) {
        return res.status(404).render("error", {
            title: "Not Found",
            error: "Game not found.",
        });
    }
    
    res.render("editGame", {
        title: "Edit Game",
        game,
    });
});
    
// POST: Submit game edits
router.post("/admin/games/:id/edit", requireLogin, requireAdmin, async (req, res) => {
    const gameId = req.params.id;
        if (!ObjectId.isValid(gameId)) {
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid game ID.",
            });
        }
    
    try {
        const { name, genre, platforms, characterNames, characterRoles, characterImages, characterDescriptions } = req.body;
    
        const gameObj = {
            name: name.trim(),
            genre: genre.trim(),
            platforms: Array.isArray(platforms) ? platforms : [platforms],
            characters: [],
        };
    
        if (Array.isArray(characterNames)) {
            for (let i = 0; i < characterNames.length; i++) {
                if (characterNames[i]) {
                    gameObj.characters.push({
                        name: characterNames[i],
                        role: characterRoles[i] || "",
                        image: characterImages[i] || "",
                        description: characterDescriptions[i] || "",
                    });
                }
            }
        } else if (characterNames) {
            gameObj.characters.push({
                name: characterNames,
                role: characterRoles,
                image: characterImages,
                description: characterDescriptions,
            });
        }
    
        const gamesCollection = await games();
        await gamesCollection.updateOne({ _id: new ObjectId(gameId) }, { $set: gameObj });
    
        res.redirect("/admin");
    } catch (e) {
        res.status(500).render("error", {
            title: "Update Failed",
            error: e.toString(),
        });
    }
});
    
// POST: Delete a game
router.post("/admin/games/:id/delete", requireLogin, requireAdmin, async (req, res) => {
    const gameId = req.params.id;

        if (!ObjectId.isValid(gameId)) {
            return res.status(400).render("error", {
                title: "Invalid ID",
                error: "Invalid game ID.",
            });
        }
    
    try {
        const gamesCollection = await games();
        await gamesCollection.deleteOne({ _id: new ObjectId(gameId) });
    
        res.redirect("/admin");
    } catch (e) {
        res.status(500).render("error", {
            title: "Delete Failed",
            error: e.toString(),
        });
    }
});
    
export default router;