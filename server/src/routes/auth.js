const express = require('express');
const passport = require("passport");

const router = express.Router();

router.get("/discord", passport.authenticate("discord"));

router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/login",
    session: true,
  }),
  async (req, res) => {
    try {
      // At this point, req.user is guaranteed to exist
      // because Passport successfully authenticated the user

      // OPTIONAL: you can attach extra data here later
      // e.g. req.user.cart merge trigger flag, etc.

      return res.redirect("http://localhost:5173/");
    } catch (err) {
      console.error("Discord callback error:", err);
      return res.redirect("/login");
    }
  }
);

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.sendStatus(204);
    });
  });
});

module.exports = router;