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
import gameData from "./data/game.js";
import notificationRoutes from "./routes/notifications.js";
import friendRoutes from "./routes/friends.js";
import teammateRoutes from "./routes/teammates.js";

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
        ifEquals: function (a, b, options) {
            return a === b ? options.fn(this) : options.inverse(this);
        },
        get: (obj, key) => obj?.[key],
        charSelected: (charMap, game, character) =>
            Array.isArray(charMap?.[game]) && charMap[game].includes(character),
        includes: (arr, val) => Array.isArray(arr) && arr.includes(val),
        join: (arr, sep) => (Array.isArray(arr) ? arr.join(sep) : arr),
    },
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use('/friends', friendRoutes);
app.use("/notifications", notificationRoutes);
app.use("/teammates", teammateRoutes);

// Routes
configRoutes(app);


async function startServer() {
    try {
        const db = await dbConnection();
        await gameData.initializeGames();

        app.listen(port, () => {
            console.log(`Server running on http://localhost:3000`);
        });
    } catch (e) {
        console.error("Failed to connect to MongoDB or initialize games:", e);
    }
}

startServer();
