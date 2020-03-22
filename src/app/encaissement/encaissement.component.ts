import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
@Component({
  selector: 'app-encaissement',
  templateUrl: './encaissement.component.html',
  styleUrls: ['./encaissement.component.scss']
})
export class EncaissementComponent implements OnInit {

  encaissements;
  user;

  constructor( private api: ApiProvider) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.getReceipts();
  }

  ngOnInit() {
  }

  getReceipts() {
    const load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });

    this.api.Receipts.getList({_includes: 'bill.customer,user', user_id: this.user.id, should_paginate: false, _sort: 'created_at', _sortDir: 'desc'}).subscribe(b => {
      b.forEach((v, k) => {
        v.name = v.bill.customer.name;
        v.bvs_id = v.bill.id;
        v.vendeur = v.user.name;
      });
      this.encaissements = b;
      console.log('b', b);
      Metro.activity.close(load);
    }, q => {
      Metro.activity.close(load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }
}
