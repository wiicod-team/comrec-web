import {Injectable} from '@angular/core';
import {ApiProvider} from '../api/api';
import * as _ from 'lodash';
import {NgxPermissionsService, NgxRolesService} from 'ngx-permissions';

/*
  Generated class for the AuthProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AuthProvider {

  public token: string;
  public token_key = 'jwt_token';

  constructor(public api: ApiProvider, private permissionsService: NgxPermissionsService, private rolesService: NgxRolesService) {
    console.log('Hello AuthProvider Provider');
    this.token = localStorage.getItem(this.token_key);
  }

  isLogged(): boolean {
    // console.log("z");
    return localStorage.getItem(this.token_key) != undefined;
  }

  login(credentials: {username: string, password: string}) {
    this.permissionsService.flushPermissions();
    return new Promise((resolve, reject) => {
      this.api.restangular.all('auth/signin').post(credentials)
        .subscribe( (response) => {
          console.log(response);
          const data = response.body.data;
          this.storeSession(response.body.data)
          // this.save_token(data.user);
          /*angular.forEach(data.userRole, function (value) {
            AclService.attachRole(value)
          });

          AclService.setAbilities(data.abilities);
          $auth.setToken(response.data);*/
          resolve(data);
        }, function(error) {
          console.log(error);
          /*if (error.status == 401) {
            var errors = error.data.errors;
            for (var key in errors) {
              if (errors.hasOwnProperty(key)) {
                var txt = errors[key][0];
                for (var i = 1; i < errors[key].length; i++) {
                  txt += "<br>" + errors[key][i];
                }
                key = key.split("_").join(" ");
                ToastApi.error({'msg': txt})
              }
            }
          }*/
          reject(error);
        });
    });

  }
  register(credentials: {first_name: string, last_name: string, phone?: string, email: string, password: string}) {
    return new Promise((resolve, reject) => {
      this.api.restangular.all('auth/signup').post(credentials)
        .subscribe( (response) => {
          const data = response.body.data;
          localStorage.setItem(this.token_key, data.token);
          localStorage.setItem('user', data.user);

          resolve(data);
        }, function(error) {
          console.log(error);

          reject(error);
        });
    });

  }

  /*save_tokezn(user) {

    return new Promise((resolve, reject) => {
      this.notif.getDeviceToken().then((token) => {
        if (Array.isArray(user.device_tokens)) {
          if (_.indexOf(user.device_tokens, token) < 0) {
            user.device_tokens.push(token);
          }
        } else {
          user.device_tokens = [token];
        }
        this.update_info(user);
        resolve(user);
      }, (err) => {
        reject(err);
        console.log(err);
      });
    });

  }*/

  update_info(credentials: {
    id: number, first_name?: string, last_name?: string, phone?: string, email?: string,
    password: string, device_tokens?: string[]
  }) {
    return new Promise((resolve, reject) => {
      this.api.restangular.all('auth/update_info').post(credentials)
        .subscribe((response) => {
          const data = response.body.data;
          localStorage.setItem(this.token_key, data.token);
          localStorage.setItem('user', data.user);

          resolve(data);
        }, function(error) {
          console.log(error);

          reject(error);
        });
    });

  }

  logout() {
    return   new Promise((resolve, reject) => {
      localStorage.removeItem(this.token_key);
      localStorage.removeItem('user');
      resolve(true);
      // AclService.flushRoles();
      // AclService.setAbilities({});
    });
  }

  getContext() {
    return   new Promise((resolve, reject) => {
      if (this.isLogged()) {
        resolve(localStorage.getItem('user'));

      } else {
        reject('not logged');
      }
    });
  }

  loadPermissions() {
    this.api.me.get().subscribe((data) => {
      this.storeSession(data.body.data);
    });

  }
  private storeSession(data: any) {
    localStorage.setItem(this.token_key, data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    _.forEach(data.roles, (value) => {
      this.permissionsService.addPermission(value);
    });
    this.rolesService.addRoles(data.roles);
  }
}
