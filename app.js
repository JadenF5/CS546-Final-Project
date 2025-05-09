import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { requireLogin, redirectIfLoggedIn } from "./middleware/auth.js";
import { dbConnection } from "./config/mongoConnection.js";
import configRoutes from "./routes/index.js";
import handlebars from "handlebars";
import { checkLoyalMember } from "./middleware/achievements.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(join(__dirname, "public")));

// Session setup
app.use(
    session({
        name: "AuthCookie",
        secret: "supersecretkeyfortheforum",
        resave: false,
        saveUninitialized: false,
    })
);

// Middleware for achievements
app.use(checkLoyalMember);

// Register handlebars with helper
const hbs = exphbs.create({
    defaultLayout: "main",
    helpers: {
        json: (context) => JSON.stringify(context),
        lookup: (obj, field) => (obj && obj[field] ? obj[field] : null),
        isSelected: (game, selectedGames) =>
            selectedGames && selectedGames.includes(game),
        ifEquals: (a, b, options) => (a === b ? options.fn(this) : options.inverse(this)),
        includes: (arr, value) => Array.isArray(arr) && arr.includes(value),
        get: (obj, key) => obj?.[key],
        charSelected: (charMap, game, character) =>
            Array.isArray(charMap?.[game]) && charMap[game].includes(character),
        includes: (arr, val) => Array.isArray(arr) && arr.includes(val),
    }
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
configRoutes(app);

// Mongo connection and server start
dbConnection()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on http://localhost:3000`);
        });
    })
    .catch((e) => {
        console.error("Failed to connect to MongoDB:", e);
    });
