export const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
};

export const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/dashboard");
    }
    next();
};
