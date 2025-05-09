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

export function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === "admin") {
        return next();
    }
    return res.status(403).render("error", {
        title: "Forbidden",
        error: "You do not have permission to access this page."
    });
}
