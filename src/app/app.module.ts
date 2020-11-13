import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import * as _ from 'lodash';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {SidemenuComponent} from './sidemenu/sidemenu.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {FactureComponent} from './facture/facture.component';
import {RestangularModule} from 'ngx-restangular';
import {API_ENDPOINT} from './services/contants';
import {ApiProvider} from './providers/api/api';
import {FormsModule} from '@angular/forms';
import {AuthProvider} from './providers/auth/auth';
import {EncaissementComponent} from './encaissement/encaissement.component';
import {UsersComponent} from './users/users.component';
import {RolesComponent} from './roles/roles.component';
import {CustomersComponent} from './customers/customers.component';
import {NgMetro4Module} from 'ng-metro4';
import {FilterPipe} from './pipe/filter.pipe';
import {Page404Component} from './page404/page404.component';
import {ChartsModule} from 'ng2-charts';
import {NgxPermissionsModule, NgxPermissionsService, NgxRolesService} from 'ngx-permissions';
import {Page403Component} from './page403/page403.component';
import {ResetComponent} from './reset/reset.component';
import {ForgotComponent} from './forgot/forgot.component';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {StatutPipe} from './pipe/status';
import {PriceFormatPipe} from './pipe/price-format';
import { CustomerUniverseComponent } from './customer-universe/customer-universe.component';
import { CustomerDetailComponent } from './customer-detail/customer-detail.component';
import { ReceiptsComponent } from './receipts/receipts.component';
import {LimitToPipe} from './pipe/limit-to';

export function RestangularConfigFactory(RestangularProvider) {
  RestangularProvider
    .setBaseUrl(API_ENDPOINT)
    .addResponseInterceptor((data, operation, what, url, response, deferred) => {

      if (operation === 'getList') {

        let newResponse = what;
        if (Array.isArray(data)) {

          // newResponse = response.data[what]
          // newResponse.error = response.error
          return data;
        }
        if (data.per_page !== undefined) {
          newResponse = data.data;
          newResponse.metadata = _.omit(data, 'data');
          return newResponse;
        }
        return [{value: data}];


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

      const token = localStorage.getItem('jwt_token');
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
    RolesComponent,
    CustomersComponent,
    FilterPipe,
    StatutPipe,
    LimitToPipe,
    PriceFormatPipe,
    Page404Component,
    Page403Component,
    ResetComponent,
    ForgotComponent,
    CustomerUniverseComponent,
    CustomerDetailComponent,
    ReceiptsComponent,
  ],
  imports: [
    BrowserModule,
    InfiniteScrollModule,
    RestangularModule.forRoot(RestangularConfigFactory),
    NgxPermissionsModule.forRoot(),
    AppRoutingModule,
    NgMetro4Module,
    ChartsModule,
    FormsModule
  ],

  providers: [
    ApiProvider,
    AuthProvider,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
