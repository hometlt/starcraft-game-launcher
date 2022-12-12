import config from "../../app/config/config";
import {FileClient, request} from "../../app/files";
import {DomJS, Element} from "dom-js";

export class WebDAV extends FileClient{
  directory = ""
  host = ""
  auth = ""
  _normalizePath(fpath) {
    return fpath.replace(/\\/g, '/');
  }
  _getNodes(root, nodeName) {
    let res = [];
    root.children.forEach((node) =>{
      if (node instanceof Element) {
        if (nodeName === '*' || node.name === nodeName) {
          res.push(node);
        }
        [].push.apply(res, this._getNodes(node, nodeName));
      }
    });
    return res;
  }
  _getNodeValue(root, nodeName) {
    let nodes = this._getNodes(root, nodeName);
    return nodes.length ? nodes[0].text() : '';
  }
  async list (directoryPath){
    let response = await request({
      host: this.host,
      port: 443,
      method: 'PROPFIND',
      path: encodeURI(this._normalizePath(this.directory + directoryPath)),
      headers: {
        Host: this.host,
        Accept: '*/*',
        Authorization: this.auth,
        Depth: 1
      }
    },'text')

    return await new Promise((resolve,reject)=>{
      new DomJS().parse(response,  (err, root)=> {
        if(err){
          return reject(err)
        }
        try {
          let dir = [];
          root.children.shift()
          root.children.forEach( node => {
            if (node.name === 'd:response') {
              let name = this._getNodeValue(node, 'd:displayname')
              let directory = Boolean(this._getNodes(node, 'd:collection').length)
              dir.push({
                path: directoryPath + "/" + name,
                name ,
                size: directory ? null : +this._getNodeValue(node, 'd:getcontentlength'),
                created: new Date(this._getNodeValue(node, 'd:creationdate')).getTime(),
                modified: new Date(this._getNodeValue(node, 'd:getlastmodified')).getTime()
              });
            }
          });
          return resolve(dir);
        } catch (pareError) {
          return reject(pareError)
        }
      });
    })
  }
  async info (directoryPath){
    let response = await request({
      host: this.host,
      port: 443,
      method: 'PROPFIND',
      path: encodeURI(this._normalizePath(this.directory + directoryPath)),
      headers: {
        Host: this.host,
        Accept: '*/*',
        Authorization: this.auth,
        Depth: 1
      }
    },'text')

    return await new Promise((resolve,reject)=>{
      new DomJS().parse(response,  (err, root)=> {
        if(err){
          return reject(err)
        }
        try {
          let dir = [];
          root.children.forEach( node => {
            if (node.name === 'd:response') {
              dir.push({
                // href: _getNodeValue(node, 'd:href'),
                // isDir: Boolean(this._getNodes(node, 'd:collection').length),
                // path: directoryPath,
                // name: this._getNodeValue(node, 'd:displayname'),
                size: +this._getNodeValue(node, 'd:getcontentlength'),
                created: new Date(this._getNodeValue(node, 'd:creationdate')).getTime(),
                modified: new Date(this._getNodeValue(node, 'd:getlastmodified')).getTime()
              });
            }
          });
          return resolve(dir[0]);
        } catch (pareError) {
          return reject(pareError)
        }
      });
    })
  }
  stream (fileData){

    return request({
      host: this.host,
      port: 443,
      method: 'GET',
      path: encodeURI(this._normalizePath(this.directory + fileData.name)),
      headers: {
        'Host': this.host,
        'Accept': '*/*',
        'Authorization': this.auth,
        'TE': 'chunked',
        'Accept-Encoding': 'gzip'
      }
    })
  }
}

export class YandexDiskWebDAV extends WebDAV{
  directory = "/SC2/Commanders Conflict/"
  host = 'webdav.yandex.ru'
  auth = config.yandex.token
  infourl = "files/ydisk"
}
