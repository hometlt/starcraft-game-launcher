import {exec} from 'child_process';
import {YandexDiskWebDAV, GoogleDriveAPI, LocalFileClient, UpdateClientHeroku} from "./files";

export class Installer{
  map = `battlenet:://starcraft/map/2/239053`
  strategy =  "QUEUE"

  private fs= null
  private us= null
  private rs= null

  constructor() {
    // let fileClient = new GoogleDriveAPI()
    this.rs = new YandexDiskWebDAV()
    this.fs = new LocalFileClient()
    this.us = new UpdateClientHeroku()
  }
  get directory (){
    return this.fs.gameDirectory
  }
  set directory(value){
    this.fs.setGameDirectory(value)
  }
  get version(){
    return this.fs.version
  }
  set version(value){
    this.fs.setCurrentVersion(value)
  }
  versions(){
    return this.us.versions()
  }
  run (){
    exec(`rundll32 url.dll,FileProtocolHandler "${this.map}"`, function(err, data) {
      console.log(err)
      console.log(data.toString());
    });
    // execFile(getInstallationPath()+"/"+ "StarCraft II.exe", function(err, data) {
    //   console.log(err)
    //   console.log(data.toString());
    // });
  }

  async files(version){
    // @ts-ignore
    let installationInfo = await this.us.files()
    // @ts-ignore
    let versionFiles = installationInfo.filter(item => !item.path.startsWith("Versions"))

    if(version){
      // @ts-ignore
      versionFiles.push(...installationInfo.filter(item => item.path.startsWith("Versions/" + version.directory)))
    }
    return versionFiles
  }

  async check() {
    let versions = await this.versions()
    // @ts-ignore
    let version = this.version && versions.versions.find(v => v.id === this.version)

    let versionFiles = await this.files(version)
    let size = 0;
    let ready = true;
    let error = false;
    let loaded = 0
    let files = []

    for(let file of versionFiles){
      let fileReady;
      let fileProgress;
      size += file.size
      let local = this.directory + file.path;
      let localFileData = await this.fs.info(local)
      if(localFileData){
        loaded += localFileData.size
        fileReady = localFileData.modified >= file.modified && localFileData.size === file.size;
        if(fileReady){
          fileProgress = 100;
        }else {
          fileProgress = file.loaded / file.size * 100
          ready = false
        }
      }
      else{
        fileReady = false
        fileProgress = 0
        ready = false
      }

      files.push({
        local,
        name: file.path,
        // @ts-ignore
        loaded: localFileData.size || 0,
        size: file.size,
        ready: fileReady,
        progress: fileProgress
      })
    }

    return {
      // @ts-ignore
      versions: versions.versions,
      version,
      speed: null,
      progress: null,
      downloading: null,
      ready,
      error,
      gamedirectory: this.fs.gameDirectory,
      modDirectory: this.directory,
      host: this.rs.host,
      loaded,
      size,
      files
    }
  }

  async install({init,progress,complete,final,error}) {
    let installationData = await this.check()
    installationData.downloading = true

    init(installationData)

    let interval = setInterval(() => {
      installationData.speed = 0;
      installationData.progress = installationData.loaded / installationData.size * 100
      installationData.files.forEach(file => {

        if(file.downloading){
          file.speed = file.recorded
          installationData.speed +=file.speed
          file.recorded = 0
        }
      })
    }, 1000)

    let promises = []
    let filesTotal = installationData.files.length
    for(let fileIndex = 0; fileIndex< filesTotal; fileIndex++ ){
      let fileData = installationData.files[fileIndex];
      if(!fileData.ready){
        let promise = new Promise(async (resolve , reject) => {

          let writeStream = this.fs.create(fileData.name)

          this.rs.stream(fileData).then(res => {
            fileData.recorded =0
            fileData.loaded = 0;
            fileData.speed = 0;
            fileData.downloading = true;
            progress(installationData)
            // @ts-ignore
            res.on('data', data => {
              writeStream.write(data, () => {
                if(!fileData.ready){
                  fileData.loaded += data.length;
                  installationData.loaded += data.length;
                  fileData.progress = fileData.loaded / fileData.size * 100
                  fileData.recorded +=data.length


                  progress(installationData)
                }
              });
            })
            // @ts-ignore
            res.on('end', () => {
              resolve(fileData)
            })
          })
        })
        .then(()=>{
          fileData.ready = true
          fileData.loaded = fileData.size
          fileData.progress = 100
          progress(installationData)
          complete(fileData)
        })
        .catch((message)=>{
          fileData.error = true
          progress(installationData)
          error(fileData)
        })
        .finally(()=>{
            delete fileData.recorded
            delete fileData.speed
            delete fileData.downloading
            return fileData
          })

        if(this.strategy === "QUEUE") {
          await promise
        }
        if(this.strategy === "PARALLEL") {
          promises.push(promise)
        }
      }
    }
    if(this.strategy === "PARALLEL") {
      await Promise.all(promises)
    }

    delete installationData.downloading
    if(installationData.files.find(f => f.ready !== true) === null ){
      installationData.ready = true;
    }
    if(installationData.files.find(f => f.error !== true) !== null){
      installationData.error = true
    }
    clearInterval(interval)
    final(installationData)
  }
}
