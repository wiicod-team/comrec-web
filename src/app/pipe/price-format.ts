import {Injectable, Pipe, PipeTransform} from "@angular/core";


@Pipe({
  name: 'priceFormat',
})

@Injectable()
export class PriceFormatPipe implements PipeTransform{

  transform(value: any, ...args: any[]): any {
    if(value==undefined){
      return "";
    }
    else{
      value += "";
      let tab = value.split('');
      let p = "";
      for (let i = tab.length; i > 0; i--) {
        if (i % 3 == 0) {
          p += " ";
        }
        p += tab[tab.length - i];
      }
      return p;
    }
  }
}
