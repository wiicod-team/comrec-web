import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {Router} from '@angular/router';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users;
  search;
  constructor(private api: ApiProvider, private router: Router) {
    this.getUsers();
  }

  ngOnInit() {
  }

  getUsers() {
    /*const load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });*/
    this.api.Users.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc', _includes: 'roles'}).subscribe(data => {
      this.users = data;
      console.log(data);
     // Metro.activity.close(load);
    }, err => {
      console.log(err);
      if (err.status === 500) {

      } else if (err.status === 401) {
        // utilisateur non logué, redirection vers la page de login
        //Metro.notify.create('Votre session à expirée', 'Info', {});
        this.router.navigate(['/login']);
      }
      //Metro.activity.close(load);
    });
  }

  resetPassword(u) {
    console.log(u);
    u.has_reset_password = false;
    u.put().subscribe(p => {
      console.log(p);
    });
  }
}
