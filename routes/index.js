import express from "express";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import gamesRouter from "./games.js";
import threadsRouter from "./threads.js"
import postsRouter from './posts.js';
import achievementRoutes from "./achievements.js";
import adminRoutes from './admin.js';
import searchRoutes from "./search.js";

const router = express.Router();
import userRoutes from './users.js';

router.get("/", (req, res) => {
    res.render("home", { title: "Welcome to GameForum" });
});

export default (app) => {
    app.use("/", router);
    app.use("/", authRouter); // signup, login, logout
    app.use("/", dashboardRouter);
    app.use("/", gamesRouter);
    app.use("/", threadsRouter);
    app.use("/", postsRouter);
    app.use('/', userRoutes);
    app.use("/", achievementRoutes);
    app.use("/", adminRoutes);
    app.use("/search", searchRoutes);
};
