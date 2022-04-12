import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export class PermissionsComponent implements OnInit {

  Permissions;
  new;
  permission: {
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
    this.api.checkUser();
    this.permission = {
      id: 0,
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      put: () => {}
    };
    this.new = this.permission;
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

    this.getPermissions();
  }

  getPermissions() {
    this.api.Permissions.getList({should_paginate: false, _sort: 'display_name', _sortDir: 'asc'}).subscribe(data => {
      this.permissions = data;
      Metro.activity.close(this.load);
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
    this.permission = r;
    Metro.dialog.open('#permissionDialog1');
  }

  openNewPermission() {
    this.new = {
      id: 0,
      name: '',
      display_name: '',
      description: '',
      put: () => {}
    };
    Metro.dialog.open('#newPermissionDialog1');
  }

  newPermission() {
    // console(this.new);
    this.api.Permissions.post(this.new).subscribe(d => {
      Metro.notify.create(this.new.display_name + ' créé ', 'Permission créé', {cls: 'bg-or fg-white', timeout: 5000});
      this.getPermissions();
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('newPermission ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(this.load);
        Metro.notify.create('newPermission ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
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
              this.getPermissions();
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


  updatePermission() {
    this.permission.put().subscribe(d => {
      Metro.notify.create('Permission mise à jour', 'Succes', {cls: 'bg-or fg-white', timeout: 5000});
      this.getPermissions();
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

}
