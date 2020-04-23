import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})

export class CustomersComponent implements OnInit {
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
  per_page = 25;
  max_length = 0;
  old_max_length = 0;
  last_page = 10000000;
  throttle = 30;
  scrollDistance = 1;
  scrollUpDistance = 2;
  constructor(private api: ApiProvider) {
    this.api.checkUser();
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
    this.getUsers();
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
      console.log(this.search);
      this.customers = [];

      const opt = {
        _includes: 'users',
        should_paginate: true,
        'name-lk': this.search,
        _sort: 'name',
        _sortDir: 'asc',
        per_page: this.per_page,
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
    if (s) {
      this.customers = [];
      this.page = 1;
    }
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
        per_page: this.per_page,
        page: this.page
      };

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

  oepnLink(c) {
    this.customer = c;
    Metro.dialog.open('#linkDialog1');
  }

  link() {
    this.api.CustomerUsers.post({user_id: this.user_id, customer_id: this.customer.id}).subscribe(d => {
      Metro.notify.create('Client ' + this.customer.name + ' lié au vendeur', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
      this.getCustomers(true);
      this.user_id = 0;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('link ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(this.load);
        Metro.notify.create('link ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        this.getCustomers(true);
        this.user_id = 0;
      }
    });
  }

  unLink(e) {
    console.log(e);
    this.api.CustomerUsers.getList({customer_id: e.id, user_id: e.users[0].id}).subscribe(d => {
      d[0].remove().subscribe(data => {
        Metro.notify.create('Client ' + e.name + ' délié du vendeur', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
        this.getCustomers(true);
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('link ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
        } else {
          Metro.notify.create('unLink ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        }
      });
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('link ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('unLink ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }
  getUsers() {
    this.api.Users.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      this.users = data;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('link ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(this.load);
        Metro.notify.create('getUsers ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }
}
