import fs from 'fs'
import path from 'path'
import google from "@googleapis/drive";
import {exec} from "child_process";
import {User} from "./models/User.js";

async function fetchDiscordUser(id) {
  const response = await fetch(`https://discord.com/api/v9/users/`, {headers: {Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`}})
  if (!response.ok) throw new Error(`Error status code: ${response.status}`)
  let responseData = await response.json();
  return responseData
}

async function initialize() {
  let users
  try {
    users = await User.find().exec()
  } catch (e) {
    console.error(e)
    return setTimeout(1000, initialize)
  }
  data.users = []
  for (let user of users) {
    if (!user.google_id) continue;
    if (!user.google_refresh_token) continue;
    let drive = getGoogleDrive(user)
    let googleDriveFiles = await googleDriveFilesList(drive, user.google_drive_folder)

    data.users.push({
      avatar: user.discord_avatar,
      discord: user.discord_user,
      files: googleDriveFiles,
      folder: user.google_drive_folder,
    })
    //todo
    await uploadFiles(drive, user.google_drive_folder);
  }
}

async function googleDriveCreateRootFolder(user) {
  let drive = getGoogleDrive(user)
  googleDriveCreateFolder(drive, 'Resurgence Of The Storm', 'root')
  //save folder id in database
  await User.findByIdAndUpdate(user.id, {
    google_drive_folder: fileId
  }, {upsert: true, returnDocument: 'after', useFindAndModify: false}).exec()
}

async function googleDriveUnlink(user) {
  await User.findByIdAndUpdate(user.id, {
    $unset: {
      google_id: "",
      google_access_token: "",
      google_refresh_token: "",
      google_user: "",
      google_avatar: "",
      google_drive_folder: ""
    }
  }, {upsert: true, returnDocument: 'after', useFindAndModify: false}).exec()
}

function getGoogleDrive(user) {
  const auth = google.auth.fromJSON({
    type: 'authorized_user',
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    // refresh_token: user.google_refresh_token
  })
  return google.drive({version: 'v3', auth});
}

function openDirectoryInExplorer(directory){
  const winPath = path.resolve(directory);//.replace('\\mnt\\c\\', 'c:\\\\');
  exec(`explorer.exe "${winPath}"`);
}
