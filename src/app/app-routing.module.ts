import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import {DashbaordComponent} from './dashbaord/dashbaord.component';
import {AdministrationComponent} from './administration/administration.component';
import {FactureListComponent} from './facture-list/facture-list.component';



const routes: Routes = [
  {path : 'home', component : HomeComponent},
  {path : 'facture', component : FactureListComponent},
  {path : 'login', component : LoginComponent},
  {path : 'admin', component : AdministrationComponent},
  {path : 'dashboard', component : DashbaordComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
