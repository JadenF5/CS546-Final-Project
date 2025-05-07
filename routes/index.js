import express from "express";
import authRouter from "./auth.js";
const router = express.Router();

router.get("/", (req, res) => {
    res.render("home", { title: "Welcome to GameForum" });
});

export default (app) => {
    app.use("/", router);
    app.use("/", authRouter); // signup, login, logout
};
