import {GoogleDriveAPI} from "../files.js";
import url from 'url'

let data = {
    "client_id": "626157511978-77etuu4h21krl1s267v51180cg45ot74.apps.googleusercontent.com",
    "project_id": "heroes-of-the-strife",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "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",
    "redirect_uris": [
      "http://localhost"
    ]
}


function getAuthorizeUrl(){
  // which should be downloaded from the Google Developers Console.
  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = gdrive.client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/drive'
  });
  return authorizeUrl
}

async function getCredetialsFromAuthCallbackURL(urlstring){
  let code = url.parse(urlstring, true).query.code
  const r = await gdrive.client.getToken(code);
  gdrive.client.setCredentials(r.tokens);
  console.info('Tokens acquired.');
  return r;
}
let gdrive = new GoogleDriveAPI()
let url2 = getAuthorizeUrl()
console.log(url2)


let codeUrl = `http://localhost:3131/?code=4/0AfgeXvsCCorP177_r8RQX8t6-RMZmqE0xg7TcroFKYCb3ty0XSmC2eeaK10omBHbH33vxw&scope=https://www.googleapis.com/auth/drive`
let r = await getCredetialsFromAuthCallbackURL(codeUrl)
console.log(r)

// gdrive.client.setCredentials(r.tokens);
// const credentials = {
//   "access_token": "ya29.a0AeTM1ieFTaUIRJqdHKEA7dGAcFgAguKwqzPCuPOrNGY3kglWsFGrTXV7yJ-XqSb8RiAcR9v538L9up9vhm4X3jtQEIhfKJV3pdGNRISgXJyKuxGbC0h0TkX2GX_mpzjR_EVjGXIjoSthm-ZiM-GRpBnFPOfSaCgYKATwSARASFQHWtWOmFu-EDIBjhiBaGIftzQHb1g0163",
//   "refresh_token": "1//0cbv26JID3ziCCgYIARAAGAwSNwF-L9IrmJGXhmkRiofVlYyx82aaP6I0v-fHhrhNGEaWFw2q3VjT0Z-Fw8TRkskdWlBiQwNlgts",
//   "scope": "https://www.googleapis.com/auth/drive",
//   "token_type": "Bearer",
//   "expiry_date": 1668153000720
// }
