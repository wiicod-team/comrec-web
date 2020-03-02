import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import * as _ from 'lodash';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { SidemenuComponent } from './sidemenu/sidemenu.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FactureComponent } from './facture/facture.component';
import {RestangularModule} from 'ngx-restangular';
import {API_ENDPOINT} from './services/contants';
import {ApiProvider} from './providers/api/api';
import {FormsModule} from '@angular/forms';
import {AuthProvider} from './providers/auth/auth';
import { EncaissementComponent } from './encaissement/encaissement.component';
import { UsersComponent } from './users/users.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { RolesComponent } from './roles/roles.component';
import { CustomersComponent } from './customers/customers.component';

export function RestangularConfigFactory(RestangularProvider) {
  RestangularProvider
    .setBaseUrl(API_ENDPOINT)
    .addResponseInterceptor(function (data, operation, what, url, response, deferred) {

      if (operation === 'getList') {

        let newResponse = what;
        if (data.per_page === undefined) {

          // newResponse = response.data[what]
          // newResponse.error = response.error
          return data
        }
        newResponse = data.data;
        newResponse.metadata = _.omit(data, 'data');


        return newResponse;

      }

      return response;
    })
    .addFullRequestInterceptor((element, operation, path, url, headers, params) => {
      /*console.log('element',element);
      console.log('operation',operation);
      console.log('what',what);
      console.log('url',url);
      console.log('headers',headers);
      console.log('params',params);*/

      let token = localStorage.getItem('jwt_token');
      if (token) {
        headers.Authorization = 'Bearer ' + token;
        headers['Access-Token'] = token;
      }
    })
  ;
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SidemenuComponent,
    DashboardComponent,
    FactureComponent,
    EncaissementComponent,
    UsersComponent,
    PermissionsComponent,
    RolesComponent,
    CustomersComponent
  ],
  imports: [
    BrowserModule,
    RestangularModule.forRoot(RestangularConfigFactory),
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    ApiProvider,
    AuthProvider
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
