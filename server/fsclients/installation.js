import {GDrive}   from './drive.js'
import {EStorage} from './storage.js'
import {FSLocal}  from './local.js'

export default class Installation {
  constructor(config){

    const WIN_APPDATA_DIRECTORY = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")
    const APP_DIRECTORY_NAME = "resurgense-of-the-storm"
    const APP_DIRECTORY_PATH = `${WIN_APPDATA_DIRECTORY}/${APP_DIRECTORY_NAME}/data`

    const MOD_DIRECTORY_NAME = "Commanders Conflict"
    let GAME_PATH =  "D:/Games/StarCraft"
    let MOD_PATH = `${GAME_PATH}/Mods/${MOD_DIRECTORY_NAME}`

    this.store = new EStorage(APP_DIRECTORY_PATH)
    this.drive = new GDrive(config.google)
    this.local = new FSLocal(this.store.directory || MOD_PATH)

    // await sync(filesLocal,filesDrive)
    // await sync(filesDrive,filesLocal)

  }
  list (){
    return this.local.listDeep()
  }
}
