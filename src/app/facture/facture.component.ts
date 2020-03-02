import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';

@Component({
  selector: 'app-facture',
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.scss']
})
export class FactureComponent implements OnInit {
  search;
  factures;
  old_facture = [];
  selected_bill = [];
  display = 'none';

  constructor(private api: ApiProvider) {
    this.getBills();
  }

  ngOnInit() {}

  getBills() {
    const load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });

    this.api.Bills.getList({_includes: 'customer,receipts', should_paginate: false, _sort: 'creation_date', _sortDir: 'desc'}).subscribe(b => {
      let avance = 0;
      b.forEach(function(v, k) {
        v.name = v.customer.name;
        v.receipts.forEach(function(vv, kk) {
         avance += vv.amount;
        });
        v.avance = avance;
      });
      this.factures = b;
      this.old_facture = this.factures;
      console.log(this.factures);
      Metro.activity.close(load);
    });
  }

  openBillModal() {
    const tmp = [];
    this.factures.forEach(function(v, k) {
      if (v.check) {
        tmp.push(v);
      }
    });
    this.selected_bill = tmp;
    Metro.dialog.open('#demoDialog1');
  }

  validerEncaissement() {
    console.log('Validation de l\'encaissement');
    // actualisation
  }

  checkFacture(f) {
    f.check = true;
  }

  uncheckFacture(f) {
    f.check = false;
  }


  getItems(ev: any) {
    console.log('aze');
    // Reset items back to all of the items
    this.factures = this.old_facture;

    // set val to the value of the searchbar
    const val = ev.target.value;

    if (val && val.trim() != '') {
      this.factures = this.factures.filter((item) => {
        return (item.id.toLowerCase().indexOf(val.toLowerCase()) > -1);
      });
    }

    // if the value is an empty string don't filter the items

  }
}
