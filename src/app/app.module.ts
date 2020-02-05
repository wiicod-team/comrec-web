import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { FactureListComponent } from './facture-list/facture-list.component';
import { DashbaordComponent } from './dashbaord/dashbaord.component';
import { AdministrationComponent } from './administration/administration.component';
import {NgChartjsModule} from 'ng-chartjs';


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    LoginComponent,
    FactureListComponent,
    DashbaordComponent,
    AdministrationComponent
  ],
  imports: [
    BrowserModule,
    NgChartjsModule,
    NgChartjsModule.registerPlugin(['line', 'pie', 'radar']),
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
