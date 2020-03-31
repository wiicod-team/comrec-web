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



const routes: Routes = [
  {
    path : 's',
    component : SidemenuComponent,
    children : [
      {path : 'dashboard', component : DashboardComponent},
      {path : 'facture', component : FactureComponent},
      {path : 'encaissement', component : EncaissementComponent}
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
      {path : 'users', component : UsersComponent},
      {path : 'roles', component : RolesComponent},
      {path : 'customers', component : CustomersComponent},
    ]
  },
  {path : 'reset/:i', component : ResetComponent},
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
