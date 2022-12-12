import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import passport from 'passport'
import refresh from 'passport-oauth2-refresh'
import express from 'express'
import mongoose from 'mongoose'
import fetch from 'node-fetch'
import google from '@googleapis/drive'
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import {Strategy as DiscordStrategy} from 'passport-discord'
import {User} from './models/User.js'

const googleScope = ["profile","email","https://www.googleapis.com/auth/drive.file"]
const discordScope = ['identify', 'email', 'guilds', 'guilds.join']
const failureRedirect = "/auth"
const successRedirect = "/auth"

const app = express.Router();
let data = {}

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true,});
mongoose.set("useCreateIndex", true);
passport.serializeUser( (user, done) => { done(null, user.id);});
passport.deserializeUser( (id, done) => { User.findById(id,  done); });

const discordStrategy = new DiscordStrategy({
  clientID: process.env.DISCORD_APP_ID,
  clientSecret: process.env.DISCORD_APP_SECRET,
  callbackURL: `${process.env.HOST}auth/discord/callback`,
  scope: discordScope,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {

let user = await  User.findOneAndUpdate({discord_id: profile.id},{
  discord_id: profile.id,
  discord_access_token: accessToken,
  discord_refresh_token: refreshToken,
  discord_user: profile.username +'#'+ profile.discriminator,
  discord_avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp` //?size=128
}, {upsert: true, returnDocument: 'after',useFindAndModify: false}).exec()
  done(null, user);
})
const googleStrategy = new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.HOST}auth/google/callback`,
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  let user = await  User.findByIdAndUpdate(req.user.id,{
    google_id: profile.id,
    google_access_token: accessToken,
    google_refresh_token: refreshToken,
    google_user: profile.displayName, //profile.emails[0].value,//
    google_avatar: profile.photos[0].value
  }, {upsert: true, returnDocument: 'after',useFindAndModify: false}).exec()
  done(null, user);
})
passport.use(discordStrategy);
refresh.use(discordStrategy);
passport.use(googleStrategy)


const secure = process.env.NODE_ENV === "production"
app.get("/", async (req, res) => {

  if(!req.user){
    if(req.cookies.discord_refresh_token){

      try{
        let {accessToken, refreshToken} = await new Promise((resolve,reject) => refresh.requestNewAccessToken('discord', req.cookies.discord_refresh_token,  async (err, accessToken, refreshToken) => {
          if(err)return reject(err)
          resolve({accessToken, refreshToken})
        }))

        const response = await fetch(`https://discord.com/api/v9/users/@me`, {headers: {Authorization: `Bearer ${accessToken}`}})
        if (!response.ok) throw new Error(`Error status code: ${response.status}`)

        let profile = await response.json();
        let user = await  User.findOneAndUpdate({discord_id: profile.id},{
          discord_id: profile.id,
          discord_access_token: accessToken,
          discord_refresh_token: refreshToken,
          discord_user: profile.username +'#'+ profile.discriminator,
          discord_avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp` //?size=128
        }, {upsert: true, returnDocument: 'after',useFindAndModify: false}).exec()

        req.user = user

        res.cookie("discord_access_token", req.user.discord_access_token, {httpOnly: true, secure})
        res.cookie("discord_refresh_token", req.user.discord_refresh_token, {httpOnly: true, secure})
      }
      catch(err){
        console.error(err)
      }
    }
  }
  res.render("auth/views/home",{user: req.user, data})
})
app.get("/google", passport.authenticate("google", {scope: googleScope}))
app.get("/discord", passport.authenticate("discord"))
app.get("/google/callback", passport.authenticate("google", {failureRedirect}), async (req, res) => {
  await googleDriveCreateRootFolder(req.user)
  res.redirect(successRedirect)
})
app.get('/discord/callback', passport.authenticate('discord', {failureRedirect}), (req, res) => {
  res.cookie("discord_access_token", req.user.discord_access_token, {httpOnly: true, secure})
  res.cookie("discord_refresh_token", req.user.discord_refresh_token, {httpOnly: true, secure})
  res.redirect(successRedirect)
})
app.get("/unlink/google", async (req, res) => {
  if(!req.user){
    return res.status(403).send('You do not have rights to visit this page');
  }
  await googleDriveUnlink(req.user)

  let suser = req.session.passport.user
  delete suser.google_id
  delete suser.google_access_token
  delete suser.google_refresh_token
  delete suser.google_user
  delete suser.google_avatar

  req.session.save((err) => {
    if(err){
      console.log(err);
    }
  })
  res.redirect(successRedirect);
})
app.get("/logout", async (req, res) => {
  res.clearCookie("discord_access_token")
  res.clearCookie("discord_refresh_token")

  req.logout(()=>{})
  res.redirect(successRedirect);
})

export const authRouter = app
