import {GoogleAuth, OAuth2Client} from 'google-auth-library'
import http from 'http'
import url from 'url'
import open from 'open'
import destroyer from 'server-destroy'
import {drive} from "@googleapis/drive";

// Download your OAuth2 configuration from the Google

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


let credentials = {
  "refresh_token": "1//0c09NqAMgAs4XCgYIARAAGAwSNwF-L9IrrHiUTXDvkQOoxZr6N752lVOl9xKYAJTl_Ksbw4ZGi5zoIR4mBpp19nhROWVQ2muR6JU",
  // "access_token": "ya29.a0Aa4xrXNPY67n5drEUzxjWrS7SA9wsucpwWsPcCxle9ng-rVnIjX4HkNL1VX6byPxoBp9_M61V7LGkrjq_NmmougyFEfAWehrXhemSYtN3_ONluY5d8QKaeKqksI8XJyymtRLp0RdSzPBAtKMrRuzwllxSQReaCgYKATASARMSFQEjDvL9xJkd50syuA52onSCyJ_9-A0163",
}


//
// /**
//  * Start by acquiring a pre-authenticated oAuth2 client.
//  */
// async function main() {
//   const oAuth2Client = await getAuthenticatedClient();
//   // Make a simple request to the People API using our pre-authenticated client. The `request()` method
//   // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
//   const url = 'https://people.googleapis.com/v1/people/me?personFields=names';
//   const res = await oAuth2Client.request({url});
//   console.log(res.data);
//
//   // After acquiring an access_token, you may want to check on the audience, expiration,
//   // or original scopes requested.  You can do that with the `getTokenInfo` method.
//   const tokenInfo = await oAuth2Client.getTokenInfo(
//     oAuth2Client.credentials.access_token
//   );
//   console.log(tokenInfo);
// }



async function xxx(){
  const oAuth2Client = new OAuth2Client(
    data.client_id,
    data.client_secret,
    data.redirect_uris[0]
  );


  let tokenDetails = await fetch("https://accounts.google.com/o/oauth2/token", {
    "method": "POST",
    "body": JSON.stringify({
      "client_id": data.client_id,
      "client_secret": data.client_secret,
      "refresh_token": credentials.refresh_token,
      "grant_type": "refresh_token",
    })
  });


  tokenDetails = await tokenDetails.json();
  const r = await oAuth2Client.getToken(tokenDetails.access_token);
// Make sure to set the credentials on the OAuth2 client.
  oAuth2Client.setCredentials(r.tokens);
  console.info('Tokens acquired.');
  let a = new Date();a.setTime(r.tokens.expiry_date); a.toISOString()
}
await xxx().catch(console.error)
