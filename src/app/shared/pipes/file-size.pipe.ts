import {Pipe, PipeTransform} from "@angular/core";

@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {

  transform(bytes: number = 0, decimals: number = 2, minscale: number = 2, mindecimals: number = 3): string {
    const k = 1024,
    sizes = ['b', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.max(minscale, Math.floor(Math.log(bytes) / Math.log(k)));
    if(i < mindecimals){
      decimals = 0
    }
    let displaySize = bytes ? Math.max(1,(bytes / Math.pow(k, i))):0
    return parseFloat(displaySize.toFixed(decimals)) + ' ' + sizes[i];
  }
}
