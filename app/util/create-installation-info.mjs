import {GoogleDriveAPI, YandexDiskWebDAV} from "../files.js";
import fs from 'fs'

let disk = new YandexDiskWebDAV()
let drive = new GoogleDriveAPI()

async function readRecoursive(fileClient,directory,files){
  let items = await fileClient.list(directory)
  for(let item of items){
    if(item.size === null){
      await readRecoursive(fileClient,item.path,files)
    }
    else{
      files.push(item)
    }
  }
}
async function checkInstallation(fileClient) {
  let installationInfo = await getVersions()

  let files = []


  for(let file of installationInfo.common){
    let remoteFileData = await fileClient.info( file)
    remoteFileData.path = file
    files.push(remoteFileData)
  }
  for(let version of installationInfo.versions){
    await readRecoursive(fileClient,"Versions/"+ version.directory,files)
  }

  return files
}


let diskData = await checkInstallation(disk)
fs.writeFileSync("info-disk.json",JSON.stringify(diskData),{encoding : 'utf-8'})
// let driveData = await checkInstallation(drive)
// fs.writeFileSync("info-drive.json",JSON.stringify(driveData),{encoding : 'utf-8'})
