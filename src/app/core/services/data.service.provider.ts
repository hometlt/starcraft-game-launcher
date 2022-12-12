import { AbstractDataService, DataServiceWeb, DataServiceElectron, DataServiceMocked } from './data.service';
import {ElectronService} from "./electron.service";
import {NgZone} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {WebsocketService} from "../../../websocket";

// Further reading:
// https://angular.io/docs/ts/latest/guide/dependency-injection.html#!#injector-providers

// DataService factory - Responsible to instantiate the service
function dataServiceFactory (electronService: ElectronService,ngZone: NgZone, http: HttpClient, ws: WebsocketService) {
  // Example how to instantiate services conditionally
  return electronService.isElectron ? new DataServiceElectron(ngZone, electronService) : new DataServiceWeb(http, ws);
}

// Provider - Used in the Component
export let DataServiceProvider = {
  provide: AbstractDataService,
  useFactory: dataServiceFactory,
  deps: [ElectronService, NgZone, HttpClient, WebsocketService ]
};

