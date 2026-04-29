import express from "express";
import passport from "../auth/google.js";

const router = express.Router();

// Step 1 - Redirect user to Google login page
router.get("/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

// Step 2 - Google redirects back here after login
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/failed",
  }),
  (req, res) => {
    res.redirect("/api/auth/success");
  }
);

// Success route
router.get("/success", (req, res) => {
  console.log(req.user);
  res.json({
    success: true,
    message: "Authentication successful",
    user: {
      id: req.user.id,
      name: req.user.displayName,
      email: req.user.emails[0].value,
      photo: req.user.photos[0].value,
    },
  });
});

// Failed route
router.get("/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Authentication failed",
  });
});

// Logout
router.get("/logout", (req, res) => {
  req.session = null;
  req.logout(() => {
    res.redirect("/");
  });
});

export default router;