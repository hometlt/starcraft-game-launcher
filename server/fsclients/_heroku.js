import * as https from "https";
import config from "./config/config";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const errorCodes = {
  401:'Auth error',
  404:'Not found',
  409:'Conflict',
  400:'Bad Destination',
  507:'Insufficient Storage'
}

export function request(options,encoding = null){
  return new Promise((resolve, reject) =>{
    let request = https.request(options, (res) => {
      let code = res.statusCode
      if (code >= 200 && code < 300) {
        if(encoding){
          let response = '';
          res.setEncoding('utf-8');
          res.on('data', function(chunk) {
            response += chunk;
          });
          res.on('end', function() {
            if(encoding === 'json'){
              resolve(JSON.parse(response))
            }
            else{
              resolve( response);
            }
          });
        }
        else{
          resolve(res)
        }
      } else {
        reject (errorCodes[code] || `Unknown error, code: ${code}`)
      }
    })
      .on('socket', (socket) => {
        socket.setTimeout(60000);
        socket.on('timeout', function () {
          request.destroy();
          reject('timeout')
        });
      })
      .on('error', (err) => {
        reject(err.message)
      })
      .end();
  })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class UpdateClientHeroku  {
  infohost = config.server.host
  infodomain = ""
  infopath = ""
  infourl = ""
  versionsurl = "versions"
  constructor() {
    this.setInfoHost(this.infohost)
  }
  setInfoHost(host){
    this.infohost = host
    this.infodomain = host.substring(0,host.indexOf("/"))
    this.infopath = host.substring(host.indexOf("/"))

  }
  versions() {
    return request({
      hostname: this.infodomain,
      port: 443,
      path: this.infopath + "/" + this.versionsurl,
      method: 'GET'
    }, 'json').then(response => {
      // @ts-ignore
      return response.versions
    })
  }
  files (){
    return request({
      hostname: this.infodomain,
      port: 443,
      path: this.infopath + "/" + this.infourl,
      method: 'GET'
    }, 'json')
  }
}



