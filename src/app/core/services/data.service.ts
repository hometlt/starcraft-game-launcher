import {Injectable, NgZone, Pipe, PipeTransform} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ElectronService} from "./index";
import {BehaviorSubject,Observable} from "rxjs";
import {WebsocketService} from "../../../websocket";
import {WS} from "./websocket.events";

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
  gameDirectoryCorrect?: boolean,
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



// Abstract class - defines the service interface
@Injectable()
export abstract class AbstractDataService {
  public abstract auth() : void
  public abstract setVersion(version: string): void
  public abstract stopInstallation(): void
  public abstract installGame(): void
  public abstract startGame(): void
  public abstract directoryDialog() : void
  public abstract directoryOpen() : void
}

class DataServiceBase {
  installation$: BehaviorSubject<InstallationData>;
  profile$: BehaviorSubject<any>;
  version = null;
  constructor() {
    this.installation$ = new BehaviorSubject({initializing: true});
    this.profile$ = new BehaviorSubject(null);
  }
}

@Injectable()
export class DataServiceElectron extends DataServiceBase implements AbstractDataService{
  constructor(private ngZone: NgZone, private electron: ElectronService) {
    super();
    console.log(process.env);
    console.log('Run in electron');
    console.log('Electron ipcRenderer', this.electron.ipcRenderer);
    console.log('NodeJS childProcess', this.electron.childProcess);

    this.electron.ipcRenderer.invoke( 'app:initialize' )
    this.electron.ipcRenderer
      .on( 'app:installation-update', ( event, installationData ) => {
        ngZone.run(() => {
          this.installation$.next(installationData)
        })
      })
      .on( 'app:open-url', ( event, response ) => {
        ngZone.run(() => {
          console.log("!!!" + response.url)
          // this.activeUrl$.next(response.url)
        })
      })
  }
  public auth(){
    this.electron.ipcRenderer.invoke( 'app:battlenet-auth' )
  }
  public setVersion(version: string){
    this.electron.ipcRenderer.invoke( 'app:set-version', version )
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
  public directoryOpen() {
    this.electron.ipcRenderer.invoke( 'app:game-directory-open' )
  }
}



export interface IMessage {
  id: number;
  text: string;
}

// DataService Implementation 1
// It's going to be instantiated when AppService.State == 1.
@Injectable()
export class DataServiceWeb extends DataServiceBase implements AbstractDataService  {
  private messages$: Observable<IMessage[]>;
  private counter$: Observable<number>;
  private texts$: Observable<string[]>;

  constructor(private http: HttpClient, private wsService: WebsocketService) {
    super();
    console.log('Run in browser');

    // this.http.get('/installation').subscribe(data => {
    //   console.log(data)
    // })

    // get messages
    this.messages$ = this.wsService.on<IMessage[]>(WS.ON.MESSAGES);

    // get counter
    this.counter$ = this.wsService.on<number>(WS.ON.COUNTER);

    // get texts
    this.texts$ = this.wsService.on<string[]>(WS.ON.UPDATE_TEXTS);

  }

  public sendText(): void {
      this.wsService.send(WS.SEND.SEND_TEXT, 'ddd');
  }

  public auth(){
    this.http.get('/app/auth')
  }
  public setVersion(version: string){
    this.http.post('/app/set-version',{version})
  }
  public stopInstallation(){
    this.http.get('/app/install-cancel')
  }
  public installGame(){
    this.http.get('/app/install-game')
  }
  public startGame(){
    this.http.get('/app/start-game')
  }
  public directoryDialog() {
    this.http.get('/app/directory-dialog')
  }
  public directoryOpen() {
    this.http.get('/app/game-directory-open')
  }
}

@Injectable()
export class DataServiceMocked extends DataServiceBase implements AbstractDataService  {
  constructor() {
    super();
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
  public auth(){
    console.warn( 'app:battlenet-auth' )
  }
  public setVersion(version: string){
    console.warn( 'app:set-version', version )
  }
  public stopInstallation(){
    console.warn( 'app:install-cancel' )
  }
  public installGame(){
    console.warn( 'app:install-game' )
  }
  public startGame(){
    console.warn( 'app:start-game' )
  }
  public directoryDialog() {
    console.warn( 'app:directory-dialog' )
  }
  public directoryOpen() {
    console.warn( 'app:game-directory-open' )
  }
}
