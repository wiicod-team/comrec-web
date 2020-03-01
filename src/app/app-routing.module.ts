import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {FactureComponent} from './facture/facture.component';
import {LoginComponent} from './login/login.component';
import {EncaissementComponent} from './encaissement/encaissement.component';



const routes: Routes = [
  {path : 'dashboard', component : DashboardComponent},
  {path : 'login', component : LoginComponent},
  {path : 'facture', component : FactureComponent},
  {path : 'encaissement', component : EncaissementComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
