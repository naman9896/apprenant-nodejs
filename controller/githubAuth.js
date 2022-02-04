require("dotenv").config();
var GitHubStrategy = require("passport-github").Strategy;
const user = require("../model/user");
const clientIdgit = process.env.GIT_CLIENTID;
const clientSecreTgit = process.env.GIT_CLIENTSECRET;

module.exports = function (passport) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: clientIdgit,
        clientSecret: clientSecreTgit,
        callbackURL: "http://localhost:8000/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, done) {
        // find if a user exist with this email or not
        // console.log(profile);
        user.findOne({ username: profile.username }).then((data) => {
          if (data) {
            // user exists
            return done(null, data);
          } else {
            // create a user
            user({
              username: profile.username,
              email: null,
              googleId: null,
              password: null,
              provider: "github",
              githubId: profile.id,
              thumbnail: profile.photos[0].value,
              isVerified: true,
            }).save(function (err, data) {
              return done(null, data);
            });
          }
        });
      }
    )
  );
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    user.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
