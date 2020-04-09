import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
declare var Metro;
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})

export class RolesComponent implements OnInit {
  update;
  roles;
  load;
  permissions;
  searchR: any;
  searchP: any;
  constructor(private api: ApiProvider) {
    this.searchR = '';
    this.searchP = '';
    this.refresh();
    this.update = {
      name: '',
      display_name: '',
      description : ''
    };
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
    this.api.Roles.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      console.log(data);
      this.roles = data;
      Metro.activity.close(this.load);
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create('getRoles ' + JSON.stringify(q.data.error.errors), 'Erreur role ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  getPermissions() {
    this.api.Permissions.getList({should_paginate: false, _sort: 'name', _sortDir: 'asc'}).subscribe(data => {
      console.log(data);
      this.permissions = data;
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create('getPermissions ' + JSON.stringify(q.data.error.errors), 'Erreur role ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  openEdit(i) {
    this.update = i;
    Metro.dialog.open('#editDialog');
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
              Metro.notify.create(i.display_name + 'supprimé', 'info', {});
            });
          }
        },
        {
          caption: 'Non',
          cls: 'js-dialog-close bg-noir',
          onclick: () => {

          }
        }
      ]
    });
  }

  edit() {
    this.update.put(this.update.id).subscribe(data => {
      Metro.notify.create(this.update.display_name + 'mis à jour', 'Info', {});
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create('edit ' + JSON.stringify(q.data.error.errors), 'Erreur role ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }
}

