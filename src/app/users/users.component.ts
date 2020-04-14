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
  edit_role: boolean;
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
    reset_password: boolean,
    compte_statut: boolean,
    settings: any[],
    roles: any[],
    password: string
    pass: string
    put(): any;
  };
  constructor(private api: ApiProvider, private router: Router) {
    this.search = '';
    this.user = {
      id: 0,
      name: '',
      username: '',
      status: '',
      has_reset_password: false,
      compte_statut: false,
      reset_password: false,
      password: '',
      pass: '',
      settings: [],
      roles: [],
      put: () => {}
    };
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
      data.forEach(v => {
        if (v.status === 'enable') {
          v.compte_statut = true;
        } else if (v.status === 'disable') {
          v.compte_statut = false;
        }
        if (v.has_reset_password) {
          v.pass = 'Modifié';
          v.reset_password = false;
        } else {
          v.pass = 'A modifier';
          v.reset_password = false;
        }
        if (v.settings.length > 0 && v.settings[0].ask_for_reset) {
          v.pass = 'A initialiser';
        }
      });
      this.users = data;
      Metro.activity.close(load);
    }, q => {
      Metro.activity.close(load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  editUser(u) {
    this.user = u;
    // verification des roles
    u.roles.forEach(v => {
      this.roles.forEach(r => {
        if (v.id === r.id) {
          v.check = true;
          r.check = true;
          console.log(u.id);
        }
      });
    });
    Metro.dialog.open('#userDialog1');
  }

  getRoles() {
    this.api.Roles.getList({should_paginate: false, _sort: 'display_name', _sortDir: 'asc'}).subscribe(data => {
      this.roles = data;
    }, q => {
      Metro.notify.create('getRoles ' + JSON.stringify(q.data.error.errors), 'Erreur user ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  updateUser() {
    console.log(this.roles);
    const u = this.user;
    let text = '';
    let bool = false;
    if (u.reset_password) {
      u.has_reset_password = false;
      u.password = 'password';
      u.settings = [];
      text += '-Mot de passe reinitialisé-';
      bool = true;
    }
    if (u.compte_statut && u.status === 'disable') {
      u.status = 'enable';
      text += '-Compte activé-';
      bool = true;
    } else if (!u.compte_statut && u.status === 'enable') {
      u.status = 'disable';
      text += '-Compte Désactivé-';
      bool = true;
    }
    if (this.edit_role) {
      this.roles.forEach((v, k) => {
        if (v.action === 'ajouter') {
          this.api.RoleUsers.post({user_id: u.id, role_id: v.id, user_type: 'App\\User'}).subscribe(d => {
            console.log('ok', d);
            Metro.notify.create(v.display_name + ' attribué à l\'utilisateur', 'Succes', {cls: 'bg-or fd-white'});
          }, q => {
            Metro.notify.create('updateUser ' + JSON.stringify(q.data.error.errors), 'Erreur user ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          });
        } else if (v.action === 'supprimer') {
          this.api.restangular.all('role_users/' + v.id + '/' + this.user.id).remove().subscribe( d => {
            console.log(d);
          }, q => {
            Metro.notify.create('updateUser ' + JSON.stringify(q.data.error.errors), 'Erreur user ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          });
        }
      });
    }
    if (bool) {
      u.put().subscribe(p => {
        this.getUsers();
        Metro.notify.create(text, 'Succes', {cls: 'bg-or'});
        this.active = false;
        this.reset = false;
      }, q => {
        Metro.notify.create('updateUser ' + JSON.stringify(q.data.error.errors), 'Erreur user ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      });
    }

    this.user_roles = [];
  }

  addRole(id) {
    this.api.RoleUsers.post({user_id: this.user.id, role_id: id, user_type: 'App\\User'}).subscribe(data => {
      console.log(data);
    });
  }

  removeRole(id) {
    this.api.restangular.all('role_users/' + id + '/' + this.user.id).remove().subscribe( d => {
      console.log(d);
    });
  }

  setRole(r) {
    if (r.check) {
      r.action = 'supprimer';
      r.check = false;
    } else {
      r.action = 'ajouter';
      r.check = true;
    }

    this.edit_role = true;
  }
}
