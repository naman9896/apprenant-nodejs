const express = require("express");
const router = express.Router();

const user = require("../model/user");
const postCreate = require("../model/postCreate");
const community = require("../model/community");
const replyArray = require("../model/comments");
const contactUs = require("../model/contactUs");

const bcryptjs = require("bcryptjs");
const passport = require("passport");
require("./passportLocal")(passport);
require("./googleAuth")(passport);
require("./githubAuth")(passport);
const userRoutes = require("./accountRoutes");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    res.set(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0"
    );
    next();
  } else {
    req.flash("error_messages", "Please Login to continue !");
    res.redirect("/login");
  }
}

router.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    postCreate.find({}, (err, posts) => {
      community.find({}, (err, community) => {
        res.render("index", {
          posts: posts,
          community: community,
          logged: true,
        });
      });
    });
  } else {
    postCreate.find({}, (err, posts) => {
      community.find({}, (err, community) => {
        res.render("index", {
          posts: posts,
          community: community,
          logged: false,
        });
      });
    });
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signup", (req, res) => {
  // get all the values
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  var decimal =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;
  const { email, username, password, confirmpassword } = req.body;
  // check if the are empty
  if (!email || !username || !password || !confirmpassword) {
    res.render("signup", {
      err: "All Fields Required!",
    });
    // validate email and username and password
  } else if (!email.match(mailformat)) {
    res.render("signup", {
      err: "Please enter Valid email id",
    });
  } else if (!password.match(decimal)) {
    res.render("signup", {
      err: "Password must contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character",
    });
  } else if (password != confirmpassword) {
    res.render("signup", {
      err: "Password Don't Match!",
    });
  } else {
    // check if a user exists
    user.findOne(
      { $or: [{ email: email }, { username: username }] },
      function (err, data) {
        if (err) throw err;
        if (data) {
          res.render("signup", {
            err: "User Exists, Try Logging In!",
          });
        } else {
          // generate a salt
          bcryptjs.genSalt(12, (err, salt) => {
            if (err) throw err;
            // hash the password
            bcryptjs.hash(password, salt, (err, hash) => {
              if (err) throw err;
              // save user in db
              user({
                username: username,
                email: email,
                password: hash,
                googleId: null,
                githubId: null,
                provider: "email",
              }).save((err, data) => {
                if (err) throw err;
                // login the user
                res.redirect("/login");
              });
            });
          });
        }
      }
    );
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
    failureFlash: true,
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy(function (err) {
    res.redirect("/");
  });
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

router.get("/auth/github", passport.authenticate("github"));

router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/profile");
  }
);

router.get("/profile", checkAuth, (req, res) => {
  // adding a new parameter for checking verification
  postCreate.find({}, (err, posts) => {
    community.find({}, (err, community) => {
      res.render("profile", {
        username: req.user.username,
        verified: req.user.isVerified,
        posts: posts,
        community: community,
      });
    });
  });
});

/* CONTACT PAGE  */
router.get("/contactUs", (req, res) => {
  res.render("contactUs");
});

router.post("/contactUs", (req, res) => {
  contactUs({
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    email: req.body.email,
    message: req.body.message,
  }).save((err, data) => {
    if (err) throw err;
    if (req.isAuthenticated()) {
      res.render("contactUs");
    }
    res.render("login");
  });
});

router.get("/compose", checkAuth, (req, res) => {
  res.render("compose", {
    username: req.user.username,
  });
});

/* SEARCH BAR */
router.post("/search", async (req, res) => {
  const allPosts = await postCreate.find({
    postTitle: { $regex: String(req.body.searchTerm) },
  });
  res.render("searchBar", {
    allPosts: allPosts,
  });
  console.log(allPosts);
});

router.post("/compose", upload.single("file"), (req, res) => {
  let options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  postCreate({
    postTitle: req.body.title,
    postContent: req.body.postContent,
    postBy: req.user.username,
    postByPic: req.user.thumbnail,
    postDate: new Date().toLocaleDateString("en-US", options),
    postFile: req.file.filename,
  }).save((err, data) => {
    if (err) throw err;
    // login the user
    res.redirect("/profile");
  });
});

router.get("/posts/:postId", (req, res) => {
  const requestedPostId = req.params.postId;
  const formAction = "/posts/" + requestedPostId;
  // console.log(formAction);

  postCreate.findOne({ _id: requestedPostId }, (err, post) => {
    if (req.isAuthenticated()) {
      res.render("post", {
        posts: post,
        post_id: post._id,
        postTitle: post.postTitle,
        postContent: post.postContent,
        postBy: post.postBy,
        postDate: post.postDate,
        postFile: post.postFile,
        userProfilePic: post.postByPic,
        formAction: formAction,
        logged: true,
      });
    } else {
      res.render("post", {
        posts: post,
        post_id: post._id,
        postTitle: post.postTitle,
        postContent: post.postContent,
        postBy: post.postBy,
        postFile: post.postFile,
        postDate: post.postDate,
        userProfilePic: post.postByPic,
        formAction: formAction,
        logged: false,
      });
    }
  });

  // Render Comment
});

router.post("/posts/:postId", (req, res) => {
  // console.log(req.body.comment);

  // Find a Post and then push comment object to comment array
  postCreate.updateOne(
    { _id: req.params.postId },
    {
      $push: {
        comments: { username: req.user.username, comment: req.body.comment },
      },
    },
    function (err, post) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/posts/" + req.params.postId);
        // console.log("Comment ADDED");
      }
    }
  );
});

router.get("/user/profile", checkAuth, (req, res) => {
  // console.log(req.user.provider);
  postCreate.find({}, (err, posts) => {
    res.render("userProfile", {
      username: req.user.username,
      provider: req.user.provider,
      thumbnail: req.user.thumbnail,
      about: req.user.about,
      posts: posts,
    });
  });
});

// Commuity

router.get("/create-community", checkAuth, (req, res) => {
  res.render("createCommunity", {
    username: req.user.username,
  });
});

router.post("/create-community", upload.single("cimage"), (req, res) => {
  community({
    name: req.body.cname,
    about: req.body.cabout,
    owner: req.user.username,
    image: req.file.filename,
  }).save((err, data) => {
    if (err) throw err;

    res.redirect("/user/profile");
  });
});

router.get("/community/:communityId", (req, res) => {
  const requestedCommunityId = req.params.communityId;
  const formAction = "/community/" + requestedCommunityId;

  community.findOne({ _id: requestedCommunityId }, (err, community) => {
    if (req.isAuthenticated()) {
      res.render("community", {
        username: req.user.username,
        community: community,
        formAction: formAction,
        logged: true,
      });
    } else {
      res.render("community", {
        community: community,
        formAction: formAction,
        logged: false,
      });
    }
  });
});

router.get("/user-profile-edit", checkAuth, (req, res) => {
  res.render("userProfileEdit", {
    username: req.user.username,
  });
});

router.post("/user-profile-edit", upload.single("image"), (req, res) => {
  user.updateOne(
    { username: req.user.username },
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      DOB: req.body.DOB,
      thumbnail: req.file.filename,
    },
    function (err, done) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/user-profile-view");
      }
    }
  );
});

router.get("/user-about", checkAuth, (req, res) => {
  res.render("userAbout", {
    username: req.user.username,
  });
});

router.post("/user-about", checkAuth, (req, res) => {
  user.updateOne(
    { username: req.user.username },
    {
      about: req.body.about,
    },
    function (err, done) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/user-profile-view");
      }
    }
  );
});

router.get("/user-created-communities", checkAuth, (req, res) => {
  community.find({ owner: req.user.username }, (err, communities) => {
    // console.log(communities);
    res.render("userCreatedCommunities", {
      username: req.user.username,
      thumbnail: req.user.thumbnail,
      provider: req.user.provider,
      about: req.user.about,
      communities: communities,
    });
  });
});

router.get("/user-profile-view", checkAuth, (req, res) => {
  res.render("userProfileView", {
    username: req.user.username,
    thumbnail: req.user.thumbnail,
    about: req.user.about,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    DOB: req.user.DOB,
  });
});

router.use(userRoutes);

module.exports = router;
