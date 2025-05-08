import express from "express";
import session from "express-session";
import exphbs from "express-handlebars";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { requireLogin, redirectIfLoggedIn } from "./middleware/auth.js";
import { dbConnection } from "./config/mongoConnection.js";
import configRoutes from "./routes/index.js";
import handlebars from "handlebars";

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

// Register handlebars with helper
const hbs = exphbs.create({
    defaultLayout: "main",
    helpers: {
        json: (context) => JSON.stringify(context),
        lookup: (obj, field) => (obj && obj[field] ? obj[field] : null),
        isSelected: (game, selectedGames) =>
            selectedGames && selectedGames.includes(game),
    },
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

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
