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
  state = false;
  facture: {id: number, avance?: number, amount?: number} = {id: 0};
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
      _includes : 'customers.bills.receipts',
      should_paginate: false,
      _sort: 'created_at',
      _sortDir: 'desc'
    };

    this.api.Users.get(this.user.id, opt).subscribe(d => {
      this.factures = [];
      d.body.customers.forEach((v, k) => {
        v.bills.forEach((vv, kk) => {
          let avance = 0;
          vv.name = v.name;
          vv.receipts.forEach((vvv, kkk) => {
            avance += vvv.amount;
          });
          vv.avance = avance;
          if (vv.status === 'pending') {
            vv.statut = 'Echue';
            this.factures.push(vv);
          } else if (vv.status === 'new') {
            vv.statut = 'Non echue';
            this.factures.push(vv);
          }
        });
      });
      this.old_facture = this.factures;
      Metro.activity.close(load);
    }, q => {
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      this.state = false;
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
    this.state = true;
    console.log('Validation de l\'encaissement');
    // actualisation
    let i = 0;
    this.selected_bill.forEach(f => {
      this.api.Bills.get(f.id).subscribe(fa => {
        fa.status = 'paid';
        fa.id = f.id;
        fa.put().subscribe(d => {
          this.api.Receipts.post({bill_id: f.id, amount: f.amount - f.avance, note: 'Soldé', user_id: this.user.id}).subscribe(da => {
            console.log('ok', f.id);
            i++;
            Metro.notify.create('Facture ' + f.id + ' encaissée', 'Succès', {cls: 'bg-gris', timeout: 3000});
            if (i === this.selected_bill.length) {
              // arret du loading
              this.getBills();
              this.state = false;
            }
          });
        }, q => {
          Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          this.state = false;
        });
      }, q => {
        Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        this.state = false;
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
    this.state = true;
    const opt = {
      amount: this.montant_avance,
      note: this.commentaire,
      bill_id: this.facture.id,
      user_id: this.user.id
    };

    this.api.Receipts.post(opt).subscribe(d => {
      console.log('post receipt ok');
      Metro.notify.create('Encaissement validé', 'Succès', {cls: 'success', timeout: 3000});
      if (this.montant_avance >= (this.facture.amount - this.facture.avance)) {
        // modification du statut de la facture
        this.api.Bills.get(this.facture.id).subscribe(data => {
          data.status = 'paid';
          data.id = data.body.id;
          data.put().subscribe(datap => {
            console.log('ok');
            this.state = false;
            this.getBills();
          }, q => {
            Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            this.state = false;
          });
        }, q => {
          Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          this.state = false;
        });
      } else {
        this.state = false;
        this.getBills();
      }
    }, q => {
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      this.state = false;
    });
  }
}
