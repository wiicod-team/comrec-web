import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import * as moment from 'moment';
import {ChartDataSets, ChartOptions, ChartType} from 'chart.js';
import {Label} from 'ng2-charts';
declare var Metro;
@Component({
  selector: 'app-customer-universe',
  templateUrl: './customer-universe.component.html',
  styleUrls: ['./customer-universe.component.scss']
})
export class CustomerUniverseComponent implements OnInit {
  customers = [];
  old_customers = [];
  users;
  search;
  load;
  state = false;
  isLoadingBills = false;
  user_id;
  customer;
  deb;
  fin;
  page = 1;
  per_page = 100;
  max_length = 0;
  old_max_length = 0;
  last_page = 10000000;
  throttle = 30;
  scrollDistance = 1;
  scrollUpDistance = 2;
  montant_collect = 0;
  montant_caisse = 0;
  private user: any;
  public barChartLabels;
  public barChartType = 'bar';

  public barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };
  public barChartLabels: Label[] = [moment(new Date()).format('D - M - Y')];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartDataSets[] = [
    { data: [this.montant_collect],
      label: 'Montant déclaré dans collect',
      borderColor: '#000',
      hoverBackgroundColor: '#888888',
      backgroundColor: '#c29d3d' },
    { data: [this.montant_caisse],
      label: 'Montant reçu à la caisse',
      borderColor: '#000',
      hoverBackgroundColor: '#c29d3d',
      backgroundColor: '#888888',}
  ];

  constructor(private api: ApiProvider) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.search = '';
    this.init(moment(new Date()), moment(new Date()));
  }

  ngOnInit() {
  }

  init(deb, fin) {
    this.load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });
    this.getCustomers(true);
    this.deb = moment(deb);
    this.fin = moment(fin);
    this.getReceiptsOfSeller(this.user.id);
    Metro.activity.close(this.load);
  }

  vide() {
    if (this.search === '' || this.search === undefined) {
      this.customers = this.old_customers;
      this.max_length = this.old_max_length;
    }
  }

  rechercher() {
    if (this.search === '' || this.search === undefined) {
      this.customers = this.old_customers;
      this.max_length = this.old_max_length;
    } else {
      this.state = true;
      this.page = 1;
      this.customers = [];

      const opt = {
        _includes: 'users',
        should_paginate: true,
        'name-lk': this.search,
        _sort: 'name',
        _sortDir: 'asc',
        per_page: this.per_page,
        'users-fk': 'user_id=' + this.user.id,
        page: this.page
      };

      this.api.Customers.getList(opt).subscribe(data => {
        this.last_page = data.metadata.last_page;
        this.max_length = data.metadata.total;
        data.forEach((v, k) => {
          let user = '';
          if (v.users.length > 0) {
            v.link = true;
            v.users.forEach((vv, kk) => {
              user += vv.name;
              user += ', ';
            });
          } else {
            v.link = false;
          }
          v.username = user;
          this.customers.push(v);
        });
        this.state = false;
        this.isLoadingBills = false;
        this.page++;
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('getCustomers ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
        } else {
          this.state = false;
          Metro.notify.create('getCustomers ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        }
      });
    }
  }

  getCustomers(s) {
    if (!this.isLoadingBills && this.page <= this.last_page) {
      this.isLoadingBills = true;
      if (!s) {
        this.state = true;
      }

      const opt = {
        _includes: 'users',
        should_paginate: true,
        _sort: 'name',
        _sortDir: 'asc',
        'users-fk': 'user_id=' + this.user.id,
        per_page: this.per_page,
        page: this.page
      };

      if (this.user.username === 'root') {
        delete opt['users-fk'];
      }

      this.api.Customers.getList(opt).subscribe(data => {
        this.last_page = data.metadata.last_page;
        this.max_length = data.metadata.total;
        this.old_max_length = this.max_length;
        data.forEach((v, k) => {
          let user = '';
          if (v.users.length > 0) {
            v.link = true;
            v.users.forEach((vv, kk) => {
              user += vv.name;
              user += ', ';
            });
          } else {
            v.link = false;
          }
          v.username = user;
          this.customers.push(v);
        });

        this.old_customers = this.customers;
        if (s) {
          Metro.activity.close(this.load);
        } else {
          this.state = false;
        }
        this.isLoadingBills = false;
        this.page++;
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('getCustomers ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
        } else {
          if (s) {
            Metro.activity.close(this.load);
          } else {
            this.state = false;
          }
          Metro.notify.create('getCustomers ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        }
      });
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  onScrollDown(ev) {
    this.getCustomers(false);
  }

  onUp(ev) {}

  getReceiptsOfSeller(id) {

   const opt = {
     should_paginate: false,
     user_id: id,
     _sort: 'received_at',
     'received_at-get': this.deb.format(this.api.date_format),
     'received_at-let': this.fin.format(this.api.date_format),
     _sortDir: 'desc',
   };

   this.api.Receipts.getList(opt).subscribe(d => {
     this.montant_collect = 0;
     this.montant_caisse = 0;
     d.forEach(v => {
       this.montant_collect += v.amount;
       if (v.status === 'validated') {
         this.montant_caisse += v.amount;
       }
     });
     this.barChartData = [];
     this.barChartData.push(
       { data: [this.montant_collect],
         label: 'Montant déclaré dans collect',
         borderColor: '#000',
         hoverBackgroundColor: '#888888',
         backgroundColor: '#c29d3d'
       },
       { data: [this.montant_caisse],
         label: 'Montant reçu à la caisse',
         borderColor: '#000',
         hoverBackgroundColor: '#c29d3d',
         backgroundColor: '#888888',
       }
     );
   });
  }

}
