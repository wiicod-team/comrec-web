import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {FactureComponent} from './facture/facture.component';
import {LoginComponent} from './login/login.component';
import {EncaissementComponent} from './encaissement/encaissement.component';
import {UsersComponent} from './users/users.component';
import {CustomersComponent} from './customers/customers.component';
import {RolesComponent} from './roles/roles.component';



const routes: Routes = [
  {path : 'dashboard', component : DashboardComponent},
  {path : 'login', component : LoginComponent},
  {path : 'users', component : UsersComponent},
  {path : 'roles', component : RolesComponent},
  {path : 'customers', component : CustomersComponent},
  {path : 'facture', component : FactureComponent},
  {path : 'encaissement', component : EncaissementComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
