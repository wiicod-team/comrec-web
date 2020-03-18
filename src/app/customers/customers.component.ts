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
  constructor(private api: ApiProvider) {
    this.getCustomers();
    this.getUsers();
  }

  ngOnInit() {
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
    });
  }

  link(customerId) {

  }

  getUsers() {
    this.api.Users.getList({should_paginate: false, _sort: 'username', _sortDir: 'asc'}).subscribe(data => {
      this.users = data;
    }, err => {
      if (err.status === 401) {
        // token expiré
        Metro.notify.create('Votre session a expiré', 'Veuillez-vous reconnecter', {cls: 'alert'});
      }
    });
  }
}
