import fs from "fs";
import * as storage from 'electron-json-storage'



export class EStorage {
  active = 0
  constructor(path) {
    fs.mkdirSync(path, {recursive: true});
    storage.setDataPath(path);
  }
  remove(key){
    return this.set(key,null)
  }
  set(key,value){
    this.active++
    return new Promise((resolve,reject) =>{
      const callback = (error) => {
        this.active--
        if (error) reject(error)
        else resolve(true)
      }
      if(value === null || value === undefined){
        storage.remove(key,callback)
      }
      else{
        storage.set('path', value, callback);
      }
    })
  }
}
