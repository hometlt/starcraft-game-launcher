import {Component, HostBinding, HostListener, OnInit} from '@angular/core';
import { ElectronService } from '../../core/services';
import { TranslateService } from '@ngx-translate/core';
import { APP_CONFIG } from '../../../environments/environment';
import {AbstractDataService} from "../../core/services/data.service";
import {BehaviorSubject} from 'rxjs'
import {Router, Event, ActivatedRoute, NavigationStart, NavigationEnd, NavigationError} from "@angular/router";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    public router: Router ,
    public data: AbstractDataService,
    private electronService: ElectronService,
    private translate: TranslateService,
    private route: ActivatedRoute
  ) {
    this.translate.setDefaultLang('en');
    // this.activeUrl$ = new BehaviorSubject('https://sites.google.com/view/commandersconflict/');

    // this.activeUrl$.subscribe(response => {
    //   this.router.navigate(['/', { }]);
    // })
  }

  infoURL = APP_CONFIG.infoURL

  @HostListener('click')
  myClick(){
    this.dropdown = ''
  }
  dropdown: string
  // activeUrl$: BehaviorSubject<string>;


  toggleDropdown(dropdown,$event){
    $event.stopPropagation()
    this.dropdown = this.dropdown === dropdown ? '': dropdown
  }


  ngOnInit() {
    // this.electron = this.electronService.isElectron
    this.windowed = this.electronService.isElectron

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        // Show progress spinner or progress bar
        console.log('Route change detected');
      }
      if (event instanceof NavigationEnd) {
        // Hide progress spinner or progress bar
        this.currentRoute = event.url;
        console.log(event);
      }
        if (event instanceof NavigationError) {
          // Hide progress spinner or progress bar
        // Present error to user
        console.log(event.error);
      }
    });
  }

  currentRoute = ''
  page = ''
  setup = false

  // alternatively also the host parameter in the @Component()` decorator can be used
  @HostBinding('class.electron') electron: boolean = false;
  @HostBinding('class.windowed') windowed: boolean = false;

  toggle(){
    this.windowed ? this.maximize(): this.restore()
  }
  toggleSetup(){
    this.router.navigate(['/installation', { }]);
  }
  maximize(){
    this.windowed = false;
    this.electronService.maximize()
  }
  minimize(){
    this.electronService.minimize()
  }
  close(){
    this.electronService.close()
  }
  restore(){
    this.windowed = true;
    this.electronService.restore()
  }
}
