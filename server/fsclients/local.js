import {promises as fs} from 'fs'
import {existsSync,createWriteStream,createReadStream} from 'fs'
import path from "path";
import crypto from 'crypto'

export class FSLocal {
  constructor(directory) {
    directory = directory.replace('\\','/')
    if(!directory.endsWith('/'))directory += "/"
    this.directory = directory
  }
  hash(file){
    return new Promise((resolve,reject)=>{
      let fd = createReadStream(file);
      let hash = crypto.createHash('md5');
      hash.setEncoding('hex');
      fd.on('end', function() {
        hash.end();
        resolve(hash.read())
      });
      // read all file and pipe it (write it) to the hash object
      fd.pipe(hash);
    })
  }
  listDeep(directory = '') {
    return this.list(directory,true)
  }
  async list(directory = '',deep = false) {
    try{
      let result = []
      let items = await fs.readdir(this.directory + directory)
      for (let item of items) {
        let filePath = path.resolve(this.directory + directory + item)
        let stats = await fs.lstat(filePath)
        if (stats.isDirectory()) {
          let info = {
            name: item,
            id: directory + item
          }
          if(deep){
            info.files = await this.list(directory + item + '/',true)
          }
          result.push(info)
        } else {
          let info = {
            name: item,
            id: directory + item,
            size: stats.size,
            // created: new Date(stats.ctime).getTime(),
            // modified: new Date(stats.mtime).getTime(),
          }
          info.hash = ''
          //todo remove this. slow for big files
          if(stats.size < 100000000){
            info.hash = await this.hash(filePath)
          }
          result.push(info)
        }
      }
      return result
    }
    catch(err){
      console.error(err)
    }
  }
  async delete (filename){
    let path = this.directory + filename;
    let exists = await existsSync(path)
    if(!exists) return
    let stats = await fs.lstat(path)
    if(stats.isDirectory()) {
      let files = await fs.readdir(path)
      for(let file of files){
        await this.delete(filename + "/" + file);
      }
    }
    await fs.rmdir(path);
  }
  async folder (filename){
    await fs.mkdir(this.directory +filename, {recursive: true});
  }
  read (filename){
    return createReadStream(this.directory + filename)
  }
  async write (path,readStream,callback){
    let splitter = path.lastIndexOf("/") + 1
    let parentName = path.substring(0,splitter)
    let filename = path.substring(splitter)
    await this.folder(parentName)
    let writeStream = createWriteStream(this.directory + path)
    let bytesRead = 0
    let isLastChunk = false
    let file = await new Promise((resolve,reject) =>{
      readStream.on('data', data => {
        writeStream.write(data, () => {
          bytesRead += data.length;
          callback && callback({read: bytesRead})
          if(isLastChunk){
            resolve({id: path, name: filename})
          }
        });
      })
      readStream.on('end', () => {
        isLastChunk = true;
      })
    })
    return file
  }
}
