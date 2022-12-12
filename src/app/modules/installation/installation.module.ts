import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InstallationRoutingModule } from './installation-routing.module';

import { InstallationComponent } from './installation.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [InstallationComponent],
  imports: [CommonModule, SharedModule, InstallationRoutingModule]
})
export class InstallationModule {}
