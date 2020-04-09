import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})

export class CustomersComponent implements OnInit {
  customers;
  users;
  search;
  load;
  state = false;
  user_id;
  customer;
  constructor(private api: ApiProvider) {
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
  getCustomers(s) {
    if (!s) {
      this.state = true;
    }
    this.api.Customers.getList({_includes: 'users', should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
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
      });
      this.customers = data;
      if (s) {
        Metro.activity.close(this.load);
      } else {
        this.state = false;
      }
    }, q => {
      if (s) {
        Metro.activity.close(this.load);
      } else {
        this.state = false;
      }
      Metro.notify.create('getCustomers ' + JSON.stringify(q.data.error.errors), 'Erreur customer ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  oepnLink(c) {
    this.customer = c;
    Metro.dialog.open('#linkDialog1');
  }

  link() {
    console.log(this.user_id);
    this.api.CustomerUsers.post({user_id: this.user_id, customer_id: this.customer.id}).subscribe(d => {
      Metro.notify.create('Client ' + this.customer.name + ' lié au vendeur', 'Succès', {cls: 'bg-or fg-white', timeout: 3000});
      this.getCustomers(false);
      this.user_id = 0;
    }, q => {
      console.log(q);
      Metro.activity.close(this.load);
      Metro.notify.create('link ' + JSON.stringify(q.data.error.errors), 'Erreur customer ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      this.getCustomers(false);
      this.user_id = 0;
    });
  }

  unLink(e) {
    this.api.CustomerUsers.getList({customer_id: e.id, user_id: e.users[0].id}).subscribe(d => {
      d[0].remove().subscribe(data => {
        this.getCustomers(false);
      }, q => {
        Metro.notify.create('unLink ' + JSON.stringify(q.data.error.errors), 'Erreur customer ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      });
    }, q => {
      Metro.notify.create('unLink ' + JSON.stringify(q.data.error.errors), 'Erreur customer ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }
  getUsers() {
    this.api.Users.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      this.users = data;
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create('getUsers ' + JSON.stringify(q.data.error.errors), 'Erreur customer ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }
}
