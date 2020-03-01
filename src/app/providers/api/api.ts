import {Injectable} from '@angular/core';
import {Restangular} from 'ngx-restangular';

/*
  Generated class for the ApiProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

@Injectable()
export class ApiProvider {

  public Users: any = this.restangular.service('users');

  public date_format : string = "Y-M-D";

  public autoplay_val = 5000;
  public slide_speed = 700;

  constructor(public restangular: Restangular) {
    restangular.withConfig((RestangularConfigurer) => {});
  }

  formarPrice(price) {
    if (price == undefined) {
      return "";
    } else {
      price += '';
      let tab = price.split('');
      let p = '';
      for (let i = tab.length; i > 0; i--) {
        if (i % 3 == 0) {
          p += ' ';
        }
        p += tab[tab.length - i];
      }
      return p;
    }
  }
}
