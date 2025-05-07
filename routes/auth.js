import express from "express";
import xss from "xss";
import { registerUser, loginUser } from "../data/users.js";

const router = express.Router();

router
    .route("/signup")
    .get(async (req, res) => {
        if (req.session.user) return res.redirect("/dashboard");
        res.render("signup", { title: "Sign Up" });
    })
    .post(async (req, res) => {
        const { email, username, password, confirmPassword } = req.body;

        try {
            const user = await registerUser({
                email: xss(email),
                username: xss(username),
                password: xss(password),
                confirmPassword: xss(confirmPassword),
            });
            if (user) return res.redirect("/login");
        } catch (e) {
            return res
                .status(400)
                .render("signup", { title: "Sign Up", error: e });
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
            return res
                .status(400)
                .render("login", { title: "Login", error: e });
        }
    });

router.route("/logout").get((req, res) => {
    req.session.destroy(() => {
        res.clearCookie("AuthCookie");
        res.render("logout", { title: "Logged Out" });
    });
});

export default router;
