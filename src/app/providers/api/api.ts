import {Injectable} from '@angular/core';
import {Restangular} from 'ngx-restangular';
import {Router} from '@angular/router';

/*
  Generated class for the ApiProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

@Injectable()
export class ApiProvider {

  public Bills: any = this.restangular.service('bills');
  public Customers: any = this.restangular.service('customers');
  public CustomerUsers: any = this.restangular.service('customer_users');
  public Permissions: any = this.restangular.service('permissions');
  public Receipts: any = this.restangular.service('receipts');
  public Roles: any = this.restangular.service('roles');
  public Users: any = this.restangular.service('users');

  public date_format : string = "Y-M-D";

  public autoplay_val = 5000;
  public slide_speed = 700;

  constructor(public restangular: Restangular, private router: Router) {
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

  checkUser() {
    if (JSON.parse(localStorage.getItem('user')) == null) {
      Metro.notify.create('Vous n\'êtes pas connecté', 'Erreur de connexion', {cls: 'alert'});
      this.router.navigate(['/login']);
    } else {
      // rien
    }
  }
}
