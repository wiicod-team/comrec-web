import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
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
  page = 1;
  per_page = 20;
  max_length = 0;
  old_max_length = 0;
  last_page = 10000000;
  throttle = 30;
  scrollDistance = 1;
  scrollUpDistance = 2;
  private user: any;
  constructor(private api: ApiProvider) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.search = '';
    this.init();
  }

  ngOnInit() {
  }

  init() {
    this.load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });
    this.getCustomers(true);
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

}
