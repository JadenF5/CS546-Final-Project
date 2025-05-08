import express from "express";
import xss from "xss";
import { registerUser, loginUser } from "../data/user.js";
import {
    getLeagueCharacters,
    getTFTChampions,
    getMarvelRivalsCharacters,
    getValorantAgents,
    getOverwatch2Heroes
} from "../services/gameApi.js";

const router = express.Router();

router
    .route("/signup")
    .get(async (req, res) => {
        if (req.session.user) return res.redirect("/dashboard");

        try {
            // Fetch characters for all games
            const characters = {
                "League of Legends": await getLeagueCharacters(),
                "Teamfight Tactics": await getTFTChampions(),
                "Marvel Rivals": await getMarvelRivalsCharacters(),
                "Valorant": await getValorantAgents(),
                "Overwatch 2": (await getOverwatch2Heroes()).map(h => h.name), 
            };

            // Pass characters data to the template
            res.render("signup", {
                title: "Sign Up",
                allGameCharacters: characters,
            });
        } catch (e) {
            console.error("Error fetching game characters:", e);
            res.status(500).render("error", {
                title: "Error",
                error: "Could not load game data. Please try again later.",
            });
        }
    })
    .post(async (req, res) => {
        try {
            // Extract form data
            const { email, username, password, confirmPassword, role } =
                req.body;

            // Handle favorite games (ensure it's an array)
            let favoriteGames = req.body.favoriteGames;
            if (favoriteGames && !Array.isArray(favoriteGames)) {
                favoriteGames = [favoriteGames];
            }

            // Handle favorite characters (ensure it's an array)
            let favoriteCharacters = req.body.favoriteCharacters;
            if (favoriteCharacters && !Array.isArray(favoriteCharacters)) {
                favoriteCharacters = [favoriteCharacters];
            }

            // Apply XSS sanitization to all inputs
            const sanitizedData = {
                email: xss(email),
                username: xss(username),
                password: xss(password),
                confirmPassword: xss(confirmPassword),
                role: xss(role), // Sanitize the role input
                favoriteGames: Array.isArray(favoriteGames)
                    ? favoriteGames.map((game) => xss(game))
                    : [],
                favoriteCharacters: Array.isArray(favoriteCharacters)
                    ? favoriteCharacters.map((char) => xss(char))
                    : [],
            };

            // Register the user
            const user = await registerUser(sanitizedData);

            if (user) {
                return res.redirect("/login");
            }
        } catch (e) {
            // Refetch characters data for re-rendering the form
            const characters = {
                "League of Legends": await getLeagueCharacters(),
                "Teamfight Tactics": await getTFTChampions(),
                "Marvel Rivals": await getMarvelRivalsCharacters(),
                Valorant: await getValorantAgents(),
                "Overwatch 2": (await getOverwatch2Heroes()).map(h => h.name), 
            };

            // Render form with error
            return res.status(400).render("signup", {
                title: "Sign Up",
                error: e.toString(),
                allGameCharacters: characters,
            });
        }
    });

router
    .route("/login")
    .get(async (req, res) => {
        if (req.session.user) return res.redirect("/dashboard");
        res.render("login", { title: "Login" });
    })
    .post(async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await loginUser({
                email: xss(email),
                password: xss(password),
            });

            req.session.user = user;
            return res.redirect("/dashboard");
        } catch (e) {
            return res.status(400).render("login", {
                title: "Login",
                error: e.toString(),
            });
        }
    });

router.route("/logout").get((req, res) => {
    req.session.destroy(() => {
        res.clearCookie("AuthCookie");
        res.render("logout", { title: "Logged Out" });
    });
});

router.get("/api/characters", async (req, res) => {
    const { game } = req.query;
    try {
        switch (game) {
            case "Marvel Rivals":
                return res.json({
                    characters: await getMarvelRivalsCharacters(),
                });
            case "League of Legends":
                return res.json({ characters: await getLeagueCharacters() });
            case "Valorant":
                return res.json({ characters: await getValorantAgents() });
            case "Teamfight Tactics":
                return res.json({ characters: await getTFTChampions() });
            case "Overwatch 2":
                const owHeroes = await getOverwatch2Heroes();
                return res.json({ characters: owHeroes.map(h => h.name) });
            default:
                return res.json({ characters: [] });
        }
    } catch (e) {
        console.error("Character API error", e);
        return res.status(500).json({ characters: [] });
    }
});

export default router;
