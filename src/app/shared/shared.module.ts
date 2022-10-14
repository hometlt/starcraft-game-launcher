import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import {FileSizePipe} from "../core/file-size.pipe";

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective,FileSizePipe],
  imports: [CommonModule, TranslateModule, FormsModule],
  exports: [TranslateModule, WebviewDirective, FormsModule,FileSizePipe]
})
export class SharedModule {}
