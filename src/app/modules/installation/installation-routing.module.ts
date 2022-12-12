import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { InstallationComponent } from './installation.component';

const routes: Routes = [
  {
    path: 'installation',
    component: InstallationComponent
  }
];


@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InstallationRoutingModule {}
