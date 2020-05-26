import {Injectable, Pipe, PipeTransform} from "@angular/core";


@Pipe({
  name: 'limitTo',
})

@Injectable()
export class LimitToPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    value = '' + value;
    return value.toString().substr(0, args[0]);
  }
}
