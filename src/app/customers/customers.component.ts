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
    this.getCustomers();
    this.getUsers();
  }
  getCustomers() {
    this.api.Customers.getList({_includes: 'users', should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      data.forEach((v, k) => {
        let user = '';
        if (v.users.length > 0) {
          v.users.forEach((vv, kk) => {
            user += vv.name;
            user += ', ';
          });
        }
        v.username = user;
      });
      this.customers = data;
      Metro.activity.close(this.load);
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  oepnLink(c) {
    this.customer = c;
    Metro.dialog.open('#linkDialog1');
  }

  link() {
    console.log(this.user_id);
    this.api.CustomerUsers.post({user_id: this.user_id, customer_id: this.customer.id}).subscribe(d => {
      Metro.notify.create('Client ' + this.customer.name + ' lié au vendeur', 'Succès', {cls: 'bg-gris', timeout: 3000});
      this.getCustomers();
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  unLink(e) {}
  getUsers() {
    this.api.Users.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      this.users = data;
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }
}
