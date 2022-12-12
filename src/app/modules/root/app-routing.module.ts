import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from '../../shared/components';

// import { HomeRoutingModule } from '../home/home-routing.module';
import { InstallationRoutingModule } from '../installation/installation-routing.module';
import {LoginComponent} from "./login/login.component";

const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'installation',
  //   pathMatch: 'full'
  // },
  // {
  //   path: 'login',
  //   component: LoginComponent
  // },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    // HomeRoutingModule,
    InstallationRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
