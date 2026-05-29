const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;
const bcrypt = require("bcryptjs");
const pool = require("../../../database/connection");

// -------------------- LOCAL STRATEGY (UNCHANGED) --------------------
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const result = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        if (result.rows.length === 0) {
          return done(null, false, {
            message: "Incorrect Email Address or Password.",
          });
        }

        const user = result.rows[0];

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
          return done(null, false, {
            message: "Incorrect Email Address or Password.",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// -------------------- DISCORD STRATEGY (TEST ONLY) --------------------
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ["identify", "email"],
    },
    (accessToken, refreshToken, profile, done) => {
      // ⚠️ TEST MODE ONLY (NO DATABASE)
      const user = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
      };

      return done(null, user);
    }
  )
);

// -------------------- SESSION --------------------
passport.serializeUser((user, done) => {  
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {  
  try {
    const result = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [id]
    );

    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});