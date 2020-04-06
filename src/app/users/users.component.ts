import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {Router} from '@angular/router';
declare var Metro;
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users;
  user_roles: any[];
  search;
  reset: boolean;
  active: boolean;
  public roles: any[];
  public user: {
    id: number,
    name: string,
    username: string
    status: string,
    has_reset_password: boolean,
    settings: any[],
    password: string
    put(): any;
  };
  constructor(private api: ApiProvider, private router: Router) {
    this.search = '';
    this.user = {id: 0, name: '', username: '', status: '', has_reset_password: false, password: '', settings: [], put: () => {}};
    this.getUsers();
    this.getRoles();
  }

  ngOnInit() {
  }

  getUsers() {
    const load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });
    this.api.Users.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc', _includes: 'roles'}).subscribe(data => {
      this.users = data;
      console.log(data);
      Metro.activity.close(load);
    }, q => {
      Metro.activity.close(load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  resetPassword(u) {
    u.has_reset_password = false;
    u.password = 'password';
    u.setting = [];
    u.put().subscribe(p => {
      console.log(p);
      this.getUsers();
    }, q => {
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  editUser(u) {
    this.user = u;
    Metro.dialog.open('#userDialog1');
  }

  getRoles() {
    this.api.Roles.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      console.log(data);
      this.roles = data;
    }, q => {
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  updateUser() {
    const u = this.user;
    let text = '';
    if (this.reset) {
      u.has_reset_password = false;
      u.password = 'password';
      u.settings = [];
      text += '-Mot de passe reinitialisé-';
    }
    if (this.active) {
      u.status = 'enable';
      text += '-Compte activé-';
    }
    if (this.user_roles !== undefined && this.user_roles.length > 0) {
      this.user_roles.forEach((v, k) => {
        // @ts-ignore
        this.api.RoleUsers.post({user_id: u.id, role_id: v, user_type: 'App\User'}).subscribe(d => {
          console.log('ok', d);
        }, q => {
          Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        });
      });
    }
    if (this.active || this.reset) {
      console.log('ici');
      u.put().subscribe(p => {
        this.getUsers();
        Metro.notify.create(text, 'Succes', {cls: 'bg-or'});
        this.active = false;
        this.reset = false;
      }, q => {
        Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      });
    }


  }
}
