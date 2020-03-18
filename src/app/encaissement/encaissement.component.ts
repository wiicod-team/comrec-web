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

  constructor( private api: ApiProvider) {
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

    this.api.Receipts.getList({_includes: 'bill.customer', should_paginate: false, _sort: 'creation_date', _sortDir: 'desc'}).subscribe(b => {
      b.forEach((v, k) => {
        v.name = v.bill.customer.name;
        v.bvs_id = v.bill.id;
      });
      this.encaissements = b;
      console.log(b);
      Metro.activity.close(load);
    });
  }
}
