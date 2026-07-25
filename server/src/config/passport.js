const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const DiscordStrategy = require("passport-discord").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
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

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {

      // 1. Check existing OAuth link
      const oauth = await pool.query(
        `SELECT user_id FROM oauth_accounts
         WHERE provider = 'google'
         AND provider_user_id = $1`,
        [profile.id]
      );

      if (oauth.rows.length > 0) {
        return done(null, { id: oauth.rows[0].user_id });
      }

      // 2. Email match fallback
      let user = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [profile.emails?.[0]?.value]
      );

      // 3. Create user if needed
      if (user.rows.length === 0) {
        user = await pool.query(
          `INSERT INTO users (email, password_hash)
           VALUES ($1, NULL)
           RETURNING *`,
          [profile.emails?.[0]?.value]
        );
      }

      const userId = user.rows[0].id;

      // 4. Link OAuth account
      await pool.query(
        `INSERT INTO oauth_accounts
         (user_id, provider, provider_user_id, provider_email)
         VALUES ($1, 'google', $2, $3)`,
        [
          userId,
          profile.id,
          profile.emails?.[0]?.value
        ]
      );

      // 5. MUST return DB id only
      return done(null, { id: userId });

    } catch (err) {
      return done(err, null);
    }
  }
));

// -------------------- DISCORD STRATEGY --------------------
passport.use(new DiscordStrategy(
  {
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ["identify", "email"]
  },
  async (accessToken, refreshToken, profile, done) => {
    try {

      // 1. Check if OAuth account already exists
      const oauth = await pool.query(
        `SELECT user_id FROM oauth_accounts
         WHERE provider = 'discord'
         AND provider_user_id = $1`,
        [profile.id]
      );

      if (oauth.rows.length > 0) {
        return done(null, { id: oauth.rows[0].user_id });
      }

      // 2. Try to match existing user by email
      let user = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [profile.email]
      );

      // 3. If no user exists → create one (Phase 1 allows this)
      if (user.rows.length === 0) {
        user = await pool.query(
          `INSERT INTO users (email, password_hash)
           VALUES ($1, NULL)
           RETURNING *`,
          [profile.email]
        );
      }

      const userId = user.rows[0].id;

      // 4. Link OAuth account
      await pool.query(
        `INSERT INTO oauth_accounts
         (user_id, provider, provider_user_id, provider_email)
         VALUES ($1, 'discord', $2, $3)`,
        [userId, profile.id, profile.email]
      );

      // 5. CRITICAL: return DB user.id ONLY
      return done(null, { id: userId });

    } catch (err) {
      return done(err, null);
    }
  }
));

// -------------------- SESSION --------------------
passport.serializeUser((user, done) => {  
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {  
  try {
    const result = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return done(null, false);
    }

    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});