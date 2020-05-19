import {Injectable} from '@angular/core';
import {Restangular} from 'ngx-restangular';
import {Router} from '@angular/router';
declare var Metro;
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
  public PermissionRoles: any = this.restangular.service('permission_roles');
  public Permissions: any = this.restangular.service('permissions');
  public Receipts: any = this.restangular.service('receipts');
  public Roles: any = this.restangular.service('roles');
  public Users: any = this.restangular.service('users');
  public RoleUsers: any = this.restangular.service('role_users');
  public me: any = this.restangular.one('auth/me');

  public date_format = 'Y-M-D';

  public autoplay_val = 5000;
  public slide_speed = 700;

  constructor(public restangular: Restangular, private router: Router) {
    restangular.withConfig((RestangularConfigurer) => {});
  }

  formarPrice(price) {
    if (price === undefined) {
      return '';
    } else {
      price += '';
      const tab = price.split('');
      let p = '';
      for (let i = tab.length; i > 0; i--) {
        if (i % 3 === 0) {
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
      // verification si le mot de passe a été reset
      if (!JSON.parse(localStorage.getItem('user')).has_reset_password) {
        this.router.navigate(['/reset', JSON.parse(localStorage.getItem('user')).id]);
      }
    }
  }
}
