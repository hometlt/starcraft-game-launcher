import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { HomeModule } from '../home/home.module';
import { InstallationModule } from '../installation/installation.module';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import {DataServiceProvider} from "../../core/services/data.service.provider";
import { WebsocketModule } from '../../../websocket';
import { APP_CONFIG } from '../../../environments/environment';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>  new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
  declarations: [AppComponent, LoginComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    WebsocketModule.config({
      url: APP_CONFIG.host
    }),
    InstallationModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    DataServiceProvider
  ],
  exports: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
