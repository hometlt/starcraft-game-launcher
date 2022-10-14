import {Component, HostBinding, HostListener} from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../environments/environment';
import {DataService} from "./core/services/data/data.service";
import {Router} from "@angular/router";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    public router: Router ,
    public data: DataService,
    private electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
    console.log('APP_CONFIG', APP_CONFIG);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }

  @HostListener('click')
  myClick(){
    this.data.dropdown = ''
  }

  toggleSetup(){
    this.setup = !this.setup
  }

  setup = false

  // alternatively also the host parameter in the @Component()` decorator can be used
  @HostBinding('class.maximized') maximized: boolean = false;

  maximize(){
    this.maximized = true;
    this.electronService.maximize()
  }
  minimize(){
    this.electronService.minimize()
  }
  close(){
    this.electronService.close()
  }
  restore(){
    this.maximized = false;
    this.electronService.restore()
  }
}
