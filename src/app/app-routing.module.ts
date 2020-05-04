import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {FactureComponent} from './facture/facture.component';
import {LoginComponent} from './login/login.component';
import {EncaissementComponent} from './encaissement/encaissement.component';
import {UsersComponent} from './users/users.component';
import {CustomersComponent} from './customers/customers.component';
import {RolesComponent} from './roles/roles.component';
import {Page404Component} from './page404/page404.component';
import {SidemenuComponent} from './sidemenu/sidemenu.component';
import {NgxPermissionsGuard} from 'ngx-permissions';
import {Page403Component} from './page403/page403.component';
import {ResetComponent} from './reset/reset.component';
import {ForgotComponent} from './forgot/forgot.component';
import {CustomerUniverseComponent} from './customer-universe/customer-universe.component';
import {CustomerDetailComponent} from './customer-detail/customer-detail.component';



const routes: Routes = [
  {
    path : 's',
    component : SidemenuComponent,
    children : [
      {
        path : 'dashboard',
        component : DashboardComponent,
        /*canActivate: [NgxPermissionsGuard],
        data: {
          permissions: {
            only: ['consult.dashboard'],
            redirectTo: '/s/facture'
          }
        }*/
      },
      {
        path : 'univers-client',
        component : CustomerUniverseComponent,
        /*canActivate: [NgxPermissionsGuard],
        data: {
          permissions: {
            only: ['consult.customer-universe'],
            redirectTo: '/403'
          }
        }*/
      },
      {
        path : 'detail-client/:i',
        component : CustomerDetailComponent,
        children: [
          {
            path : 'facture/:customer_id',
            component : FactureComponent,
            /*canActivate: [NgxPermissionsGuard],
            data: {
              permissions: {
                only: ['consult.dashboard'],
                redirectTo: '/403'
              }
            }*/
          },
          {
            path : 'encaissement/:customer_id',
            component : EncaissementComponent,
            /*canActivate: [NgxPermissionsGuard],
            data: {
              permissions: {
                only: ['consult.dashboard'],
                redirectTo: '/403'
              }
            }*/
          }
        ]
        /*canActivate: [NgxPermissionsGuard],
        data: {
          permissions: {
            only: ['consult.customer-universe'],
            redirectTo: '/403'
          }
        }*/
      }
    ]
  },
  {
    path : '403',
    component : Page403Component,
  },
  {
    path : 'admin',
    component : SidemenuComponent,
    canActivate: [NgxPermissionsGuard],
    data: {
      permissions: {
        only: ['manage.admin'],
        redirectTo: '/403'
      }
    },
    children : [
      {
        path : 'users',
        component : UsersComponent,
        canActivate: [NgxPermissionsGuard],
        data: {
          permissions: {
            only: ['consult.user'],
            redirectTo: '/403'
          }
        }
      },
      {
        path : 'roles',
        component : RolesComponent,
        canActivate: [NgxPermissionsGuard],
        data: {
          permissions: {
            only: ['consult.role'],
            redirectTo: '/403'
          }
        }
      },
      {
        path : 'customers',
        component : CustomersComponent,
      },
    ]
  },
  {path : 'reset/:i', component : ResetComponent},
  {path : 'forgot', component : ForgotComponent},
  {path : 'login', component : LoginComponent},
  { path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  { path: '**', component: Page404Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
