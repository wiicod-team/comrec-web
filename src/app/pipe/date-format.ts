import {Injectable, Pipe, PipeTransform} from '@angular/core';


@Pipe({
  name: 'dateFormat',
})

@Injectable()
export class DateFormatPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    if (value == undefined) {
      return '';
    } else {
      const temp = value.split(' ');
      const date = temp[0].split('-');
      return date[2] + '/' + date[1] + '/' + date[0] + ' à ' + temp[1];
    }
  }
}
