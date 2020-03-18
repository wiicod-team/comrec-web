import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
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
  user;
  facture = {id: 0};
  commentaire;
  montant_avance;
  constructor(private api: ApiProvider) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
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

    const opt = {
      _includes: 'customer,receipts',
      should_paginate: false,
      'status-in': 'pending,new',
      _sort: 'creation_date',
      _sortDir: 'desc'
    };
    this.api.Bills.getList(opt).subscribe(b => {
      b.forEach((v, k) => {
        let avance = 0;
        if (v.status === 'pending') {
          v.statut = 'Echue';
        } else if (v.status === 'new') {
          v.statut = 'Non echue';
        }
        v.name = v.customer.name;
        v.receipts.forEach((vv, kk) => {
         avance += vv.amount;
        });
        v.avance = avance;
      });
      this.factures = b;
      this.old_facture = this.factures;
      //console.log(this.factures);
      Metro.activity.close(load);
    });
  }

  openBillModal() {
    const tmp = [];
    this.factures.forEach((v, k) => {
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
    this.selected_bill.forEach(f => {
      f.status = 'paid';
      f.put().subscribe(d => {
        this.api.Receipts.post({bill_id: f.id, amount: f.amount, note: 'Soldé', user_id: this.user.id}).subscribe(da => {
          console.log('ok', f.id);
        });
      });
    });
  }

  checkFacture(f) {
    f.check = true;
  }

  uncheckFacture(f) {
    f.check = false;
  }

  avancer() {
    const f = [];
    this.factures.forEach((v, k) => {
      if (v.check) {
        f.push(v);
      }
    });
    if (f.length >= 1 && f.length < 2) {
      // ok
      Metro.dialog.open('#avanceDialog1');
      this.facture = f[0];
      console.log(f);
    } else if (f.length === 0) {
      // pas de factures selectionnées
      Metro.notify.create('Pas de facture selectionnée', 'Absence de facture', {cls: 'warning'});
    } else {
      // plus d'une facture selectionnée
      Metro.notify.create('Vous ne pouvez faire d\'avance sur plus d\'une facture', 'Trop de facture', {cls: 'warning'});
    }
  }

  validerAvance() {
    const opt = {
      amount: this.montant_avance,
      note: this.commentaire,
      bill_id: this.facture.id,
      user_id: this.user.id
    };

    this.api.Receipts.post(opt).subscribe(d => {
      console.log(d);
      if (this.montant_avance >= (this.facture.amount - this.facture.avance)) {
        Metro.notify.create('Encaissement validé', 'Succès', {cls: 'success', timeout: 3000});
        // modification du statut de la facture
        this.api.Bills.get(this.facture.id).subscribe(data => {
          data.status = 'paid';
          data.id = data.body.id;
          data.put().subscribe(datap => {
            console.log('ok');
          }, q => {
            console.log(q);
          });
        }, q => {
          console.log(q);
        });
      }
    }, q => {
      console.log(q);
    });
  }
}
