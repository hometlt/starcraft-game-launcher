import {Injectable, NgZone, Pipe, PipeTransform} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ElectronService} from "..";
import {BehaviorSubject,Observable} from "rxjs";



export interface InstallationFileData  {
  name: string,
  size?: number,
  ready?: boolean
  downloading?: boolean
  loaded?: number,
  error?: boolean
  localPath?: string,
  speed?: number,
  progress?: number
  recorded?: number
}

export interface InstallationData {
  host?: string,
  version?: string,
  versions?: any,
  gameDirectory?: string,
  modDirectory?: string,
  initializing?: boolean,
  speed?: number,
  downloading?: boolean
  error?: boolean
  ready?: boolean
  size?: number,
  loaded?: number,
  progress?: number
  files?: InstallationFileData[]
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  installation$: BehaviorSubject<InstallationData>;
  dropdown: string

  version = null;

  constructor(private httpClient: HttpClient, private electron: ElectronService,private ngZone: NgZone) {

    this.installation$ = new BehaviorSubject({
      initializing: true
    });

    if(this.electron.ipcRenderer){

      this.electron.ipcRenderer.invoke( 'app:initialize' )

      this.electron.ipcRenderer
        .on( 'app:installation-update', ( event, installationData ) => {

          ngZone.run(() => {
            this.installation$.next(installationData)
          })
        })

    }else{
      //fake

       this.installation$.next({

         version: null,
         gameDirectory: "N/A",
         modDirectory: "N/A",
         ready: false,
         downloading: true,
         error: false,

         size: 99999990,
         loaded: 99999,
         progress: 20,
        files: [
          {name: "AssetMods/Assets04.SC2Mod", size: 2199912810, loaded: 888888, speed: 1, ready: true, progress: (888888/2199912810)*100},
          {name: "AssetMods/Assets05.SC2Mod", size: 1885765300, error: true, loaded: 9999999, speed: 0, progress:(994489999/1885765300)*100},
          {name: "AssetMods/Assets06.SC2Mod", size: 1720640928, loaded: 1111111, speed: 3333, progress: (111111111/1720640928)*100},
          {name: "Versions/0.0.1.6/MapMods/BattleForSlayn.SC2Mod", size: 76575, loaded: 76575, speed: 1119111, progress: (76575/76575)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets2.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets3.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets4.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets5.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets6.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets7.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets8.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets9.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets10.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets11.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets12.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100},
          {name: "Versions/0.0.1.6/TempMods/Assets13.SC2Mod", size: 34429486, loaded: 0, progress: (0/34429486)*100}
        ]
      })
    }
  }


  toggleDropdown(dropdown,$event){
    $event.stopPropagation()
    this.dropdown = this.dropdown === dropdown ? '': dropdown
  }

  public setVersion(version: string){
    this.electron.ipcRenderer.invoke( 'app:set-version',version )
  }

  public stopInstallation(){
    this.electron.ipcRenderer.invoke( 'app:install-cancel' )
  }
  public installGame(){
    this.electron.ipcRenderer.invoke( 'app:install-game' )
  }
  public startGame(){
    this.electron.ipcRenderer.invoke( 'app:start-game' )
  }
  public directoryDialog() {
    this.electron.ipcRenderer.invoke( 'app:directory-dialog' )
  }
}
