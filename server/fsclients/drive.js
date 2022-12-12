import fs from "fs";
import {drive} from "@googleapis/drive";
import {auth} from 'google-auth-library'
import mime from 'mime-types'

export class GDrive {
  constructor({clientId, clientSecret, refreshToken, folderId = 'root'}){

    this.cache = {
      '/': {id: folderId}
    }
    this.client = auth.fromJSON({
      type: "authorized_user",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    })
    this.client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // store the refresh_token in my database!
        // console.log(tokens.refresh_token);
      }
      // console.log(tokens.access_token);
    });
    this.drive = drive({
      version: 'v3',
      auth: this.client
    });
  }
  _parseFilename(path){
    let splitter = path.lastIndexOf("/") + 1
    let parentName = path.substring(0,splitter)
    let fileName = path.substring(splitter)
    let parentId = this.cache[parentName]?.id
    let fileId = this.cache[path]?.id
    return {splitter,parentName,fileName,parentId,fileId}
  }
  async folder(path) {
    try{
      let {parentId,fileName} = this._parseFilename('/'+path)
      // let rootFiles = await this.drive.files.list({
      //   auth: this.client,
      //   q: `'${parentId}' in parents and mimeType = '${mimeType}' and name = '${filename}'`,
      //   fields: 'nextPageToken, files(id, name)'
      // })
      //if folder was already created, use it
      // let fileId
      // if (rootFiles.data.files.length) {
      //   fileId = rootFiles.data.files[0].id
      // }
      let folder = await this.drive.files.create({resource: {
        name: fileName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      }, fields: 'id'})
      this.cache['/'+path + '/'] = folder.data
      // await this.drive.permissions.create({fileId: folder.data.id, resource: {role: 'reader', type: 'anyone'}})
      return folder
    }
    catch(err){
      console.error(err)
    }
  }
  async delete(path) {
    try{
      let {parentName,fileName} = this._parseFilename(path)
      let list = await this.list('/'+parentName)
      let fileId = list.find(item => item.name === fileName).id
      await this.drive.files.delete({fileId})
    }
    catch(err){
      console.error(err)
    }
  }
  listDeep(directory = '') {
    return this.list(directory,true)
  }
  async list(path = '',deep = false) {
    // if(this.cached) {
    //   return Object.entries(this.cache)
    //     .filter(([key,value]) => {
    //       key = key.substring(0,key.length - 1)
    //       key = key.substring(0,key.lastIndexOf('/')+1)
    //       return key === fileId
    //     })
    //     .map(([key,value]) => value)
    // }

    try{
      let {parentId} = this._parseFilename(path)
      let result = []
      let response = await this.drive.files.list({
        q: `parents in '${parentId}' and trashed=false`,
        fields: 'nextPageToken, files(id, name, size, createdTime, modifiedTime, md5Checksum)'
      })
      for (let fileData of response.data.files) {
        let info = {
          id: fileData.id,
          name: fileData.name,
        }
        if (fileData.size) {
          info.hash = fileData.md5Checksum
          info.size = +fileData.size
          // info.created = new Date(fileData.createdTime).getTime()
          // info.modified = new Date(fileData.modifiedTime).getTime()
          this.cache[path + fileData.name] = info
        } else {
          if(deep){
            info.files = await this.list(fileData.id,true)
          }
          this.cache[path + fileData.name + "/"] = info
        }
        result.push(info)
      }
      return result
    }
    catch(err){
      console.error(err)
    }
  }
  async read(path){
    try{
      let {fileId} = this._parseFilename(path)
      let response = await this.drive.files.get({fileId, alt: 'media' }, {responseType: 'stream'})
      return response.data
    }
    catch(err){
      console.error(err)
    }
  }
  async write(path,readStream,callback) {
    try{
      let {fileName, parentId} = this._parseFilename('/'+path)

      let file = await this.drive.files.create({
        resource: {name: fileName, parents: [parentId]},
        media: {/*mimeType: mime.lookup(file.name), */body: readStream},
        fields: 'id, name, size, createdTime, modifiedTime, md5Checksum'
      }, {
        onUploadProgress(e) {
          callback && callback({read: e.bytesRead})
        }
      })
      // await this.drive.permissions.create({fileId: file.data.id, resource: {role: 'reader', type: 'anyone'}})
      this.cache[path] = {
        id: file.id,
        name: file.name,
        hash: file.md5Checksum,
        size: +file.size,
        // created: new Date(file.createdTime).getTime(),
        // modified: new Date(file.modifiedTime).getTime()
      }
      return file
    }
    catch(err){
      console.error(err)
    }
  }
}
