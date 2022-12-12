import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import {FileSizePipe} from "./pipes/file-size.pipe";
import {SafePipe} from "./pipes/shared.pipe";


@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective,FileSizePipe, SafePipe],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule,FileSizePipe, SafePipe]
})
export class SharedModule {}
