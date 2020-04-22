import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})

export class RolesComponent implements OnInit {
  roles;
  new;
  role: {
    id: number,
    name: string,
    display_name: string,
    description: string,
    permissions: any[]
    put(): any;
  };
  load;
  edit_state = false;
  permissions;
  edit_permission: boolean;
  searchR: any;
  searchP: any;
  constructor(private api: ApiProvider) {
    this.role = {
      id: 0,
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      put: () => {}
    };
    this.new = this.role;
    this.searchR = '';
    this.searchP = '';
    this.refresh();
  }

  ngOnInit() {
  }

  refresh() {
    this.load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });

    this.getRoles();
    this.getPermissions();
  }

  getRoles() {
    this.api.Roles.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc', _includes: 'permissions'}).subscribe(data => {
      this.roles = data;
      Metro.activity.close(this.load);
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getRoles ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(this.load);
        Metro.notify.create('getRoles ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  getPermissions() {
    this.api.Permissions.getList({should_paginate: false, _sort: 'display_name', _sortDir: 'asc'}).subscribe(data => {
      this.permissions = data;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getPermissions ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(this.load);
        Metro.notify.create('getPermissions ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  openEdit(r) {
    this.role = r;
    // console(r);
    r.permissions.forEach(v => {
      this.permissions.forEach(p => {
        if (v.id === p.id) {
          v.check = true;
          p.check = true;
          // console(r.id);
        }
      });
    });
    Metro.dialog.open('#roleDialog1');
  }

  openNewRole() {
    this.new.permissions = this.permissions;
    this.new.permissions.forEach(v => {
      v.check = false;
    });
    this.edit_state = false;
    Metro.dialog.open('#newRoleDialog1');
  }

  newRole() {
    // console(this.new);
    this.api.Roles.post(this.new).subscribe(d => {
      Metro.notify.create(this.new.display_name + ' créé ', 'Rôle créé', {cls: 'bg-or fg-white', timeout: 5000});
      let i = 0;
      // enregistrement des peromission
      this.new.permissions.forEach(v => {
        i++;
        if (v.check) {
          this.api.PermissionRoles.post({role_id: d.body.id, permission_id: v.id}).subscribe(da => {
            Metro.notify.create(v.display_name + ' associé au rôle ' + this.new.display_name, 'Rôle créé', {cls: 'bg-or fg-white', timeout: 5000});
          }, q => {
            if (q.data.error.status_code === 500) {
              Metro.notify.create('newRole ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            } else if (q.data.error.status_code === 401) {
              Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
            } else {
              Metro.notify.create('newRole ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            }
          });
        }
        if (i === this.new.permissions.length) {
          this.getRoles();
          this.new = {id: 0,
            name: '',
            display_name: '',
            description: '',
            permissions: []};
        }
      });
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('newRole ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(this.load);
        Metro.notify.create('newRole ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  delete(i) {
    Metro.dialog.create({
      title: 'Supprimer',
      content: '<div>Voullez-vous supprimer <b>' + i.display_name + '</b></div>',
      actions: [
        {
          caption: 'Oui',
          cls: 'js-dialog-close bg-or fg-white',
          onclick: () => {
            i.remove().subscribe(d => {
              Metro.notify.create(i.display_name + ' supprimé', 'info', {});
              this.getRoles();
            }, q => {
              if (q.data.error.status_code === 500) {
                Metro.notify.create('delete ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
              } else if (q.data.error.status_code === 401) {
                Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
              } else {
                Metro.notify.create('delete ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
              }
            });
          }
        },
        {
          caption: 'Non',
          cls: 'js-dialog-close bg-noir fg-white',
          onclick: () => {

          }
        }
      ]
    });
  }

  setPermission(r) {
    if (r.check) {
      r.action = 'supprimer';
      r.check = false;
    } else {
      r.action = 'ajouter';
      r.check = true;
    }
    this.edit_permission = true;
  }

  updatePermission() {
    const r = this.role;
    let index = 0;
    if (this.edit_state) {
      this.role.put().subscribe(d => {
        Metro.notify.create('Rôle mis à jour', 'Succes', {cls: 'bg-or fg-white', timeout: 5000});
        this.edit_state = false;
        this.getRoles();
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('updatePermission ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
        } else {
          Metro.notify.create('updatePermission ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        }
      });
    }
    if (this.edit_permission) {
      this.permissions.forEach((v, k) => {
        index += 1;
        if (v.action === 'ajouter') {
          this.api.PermissionRoles.post({role_id: r.id, permission_id: v.id}).subscribe(d => {
            v.action = '';
            v.check = false;
            Metro.notify.create(v.display_name + ' attribué au rôle ' + r.display_name, 'Succes', {cls: 'bg-or fg-white', timeout: 5000});
          }, q => {
            if (q.data.error.status_code === 500) {
              Metro.notify.create('updatePermission ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            } else if (q.data.error.status_code === 401) {
              Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
            } else {
              Metro.notify.create('updatePermission ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            }
          });
        } else if (v.action === 'supprimer') {
          this.api.restangular.all('permission_roles/' + v.id + '/' + r.id).remove().subscribe( d => {
            v.action = '';
            v.check = false;
            Metro.notify.create(v.display_name + ' supprimé du rôle ' + r.display_name, 'Succes', {cls: 'bg-or fg-white', timeout: 5000});
          }, q => {
            if (q.data.error.status_code === 500) {
              Metro.notify.create('updatePermission ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            } else if (q.data.error.status_code === 401) {
              Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
            } else {
              Metro.notify.create('updatePermission ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            }
          });
        }
        if (index === this.permissions.length) {
          this.load = Metro.activity.open({
            type: 'metro',
            overlayColor: '#fff',
            overlayAlpha: 1,
            text: '<div class=\'mt-2 text-small\'>Actualisation des données...</div>',
            overlayClickClose: true
          });
          this.getRoles();
        }
      });
    }
  }
}

