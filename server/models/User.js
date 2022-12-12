import findOrCreate from 'mongoose-findorcreate'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    discord_id: String,
    discord_access_token: String,
    discord_refresh_token: String,
    discord_user: String,
    discord_avatar: String,
    google_id: String,
    google_access_token: String,
    google_refresh_token: String,
    google_user: String,
    google_avatar: String,
    google_drive_folder: String,
});

userSchema.plugin(findOrCreate);
export const User = new mongoose.model("User", userSchema);



// const passportLocalMongoose = require("passport-local-mongoose");
// const fetch = require('node-fetch')

// function isLoggedIn(req,res,next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect('/login');
// }
// function isNotLoggedIn(req,res,next){
//     if(!req.isAuthenticated()){
//         return next();
//     }
//     res.redirect('/');
// }
// // You might want to store this in an environment variable or something
//
// const fetchDiscordUser = async id => {
//     const response = await fetch(`https://discord.com/api/v9/users/${id}`, {
//         headers: {
//             Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
//         }
//     })
//     if (!response.ok) throw new Error(`Error status code: ${response.status}`)
//     let responseData = await response.json();
//     return responseData
// }


// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
// passport.use(User.createStrategy());
// const FacebookStrategy = require("passport-facebook").Strategy;
// const BnetStrategy = require('passport-bnet').Strategy;
// app.get("/auth/facebook", passport.authenticate("facebook"));
// app.get("/auth/bnet", passport.authenticate("bnet"));
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");

// const bcrypt = require("bcrypt");
// const saltRounds = 10;
//
// function createUser({ email, password }){
//     const newUser = new User({ email, password });
//     // Hash password before saving in database
//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(newUser.password, salt, (err, hash) => {
//             if (err) throw err;
//             newUser.password = hash;
//             newUser
//                 .save()
//                 .then(user => {
//                     return done(null, user);
//                 })
//                 .catch(err => {
//                     return done(null, false, { message: err });
//                 });
//         });
//     });
// }
//
// // Local Strategy
// passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
//         // Match User
//         User.findOne({ email: email })
//             .then(user => {
//                 // Create new User
//                 if (!user) {
//                     createUser({ email, password })
//                     // Return other user
//                 } else {
//                     // Match password
//                     bcrypt.compare(password, user.password, (err, isMatch) => {
//                         if (err) throw err;
//
//                         if (isMatch) {
//                             return done(null, user);
//                         } else {
//                             return done(null, false, { message: "Wrong password" });
//                         }
//                     });
//                 }
//             })
//             .catch(err => {
//                 return done(null, false, { message: err });
//             });
//     })
// );
//
// userSchema.plugin(passportLocalMongoose,{usernameField: 'email'});
//

//
// app.get("/login", async (req, res) => {
//     let discord =  await (req.user?.discordId ? fetchDiscordUser(req.user.discordId) : null);
//     res.render("login",{user: req.user, discord});
// });
//
// app.get("/register", async (req, res) => {
//     res.render("register");
// });
//
// app.get("/secrets",isLoggedIn, async (req, res) => {
//     User.find({ secret: { $ne: null } }, function (err, foundUsers) {
//         if (err) {
//             console.log(err);
//         } else {
//             if (foundUsers) {
//                 res.render("secrets", { usersWithSecrets: foundUsers });
//             }
//         }
//     });
// });
//
// app.post("/submit", async (req, res) => {
//     const secretContent = req.body.secret;
//     console.log(req.user.id);
//
//     User.findById(req.user.id, (err, docs) => {
//         if (err) {
//             console.log(err);
//         } else {
//             if (docs) {
//                 docs.secret = secretContent;
//                 docs.save(() => {
//                     res.redirect("/secrets");
//                 });
//             }
//         }
//     });
// });
//
// app.get("/submit", async (req, res) => {
//     if (req.isAuthenticated()) {
//         res.render("submit");
//     } else {
//         res.redirect("/login");
//     }
// });
//
// app.post("/register", (req, res) => {User.register({ username: req.body.username }, req.body.password, (err, user) => {
//         if (err) {
//             console.log(err);
//             res.redirect("/register");
//         } else {
//             passport.authenticate("local")(req, res, () => {
//                 res.redirect("secrets");
//             });
//         }
//     }
// );
// });
//
// app.post("/login", (req, res) => {
//     const user = new User({
//         username: req.body.username,
//         password: req.body.password,
//     });
//
//     req.login(user, (err) => {
//         if (err) {
//             console.log(err);
//         } else {
//             passport.authenticate("local")(req, res, () => {
//                 res.redirect("secrets");
//             });
//         }
//     });
// });

// app.get("/auth/facebook/callback", passport.authenticate("facebook", {successRedirect, failureRedirect}));
// app.get('/auth/bnet/callback', passport.authenticate('bnet', {failureRedirect}), (req, res) => res.redirect(successRedirect));



// Use the BnetStrategy within Passport.
/*passport.use(new BnetStrategy({
    clientID: process.env.BATTLENET_CLIENT_ID,
    clientSecret: process.env.BATTLENET_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/bnet/callback',
    region: "us",
    passReqToCallback: true
}, async (req, token, tokenSecret, profile, done) => {

    let user = await  User.findOneAndUpdate({username: profile.email},{
        discordId: profile.id,
        discordToken: token
    }, {upsert: true,returnDocument: 'after',useFindAndModify: false}).exec()

    User.findOrCreate({ bnetId: profile.id }, function (err, user) {
        return done(err, user);
    });
}));*/

//
// passport.use(new FacebookStrategy({
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: "http://localhost:3000/auth/facebook/"
//     },
//     function (accessToken, refreshToken, profile, done) {
//       User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//           return done(err, user);
//       });
//     }
//   )
// );
