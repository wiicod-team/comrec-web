import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import {ActivatedRoute} from '@angular/router';
declare var Metro;

@Component({
  selector: 'app-encaissement',
  templateUrl: './encaissement.component.html',
  styleUrls: ['./encaissement.component.scss']
})
export class EncaissementComponent implements OnInit {

  encaissements;
  user;
  search;
  state = false;
  customer_id = 0;
  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;
  constructor( private api: ApiProvider, private route: ActivatedRoute) {
    this.search = '';
    this.customer_id = parseInt(this.route.snapshot.paramMap.get('customer_id'));
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.getReceipts();
  }

  ngOnInit() {
    moment.locale('fr');
    console.log(moment(new Date()).utc().utcOffset(1).format('YYYY-MM-DD HH:mm:ss'));
  }

  getReceipts() {
    this.state = true;

    const opt = {
      _includes: 'bill.customer,user',
      user_id: this.user.id,
      'bill-fk': 'customer_id=' + this.customer_id,
      should_paginate: false,
      _sort: 'received_at',
      _sortDir: 'desc'
    };

    if (this.user.id === 1) { // admin
      delete opt.user_id;
    }
    this.api.Receipts.getList(opt).subscribe(b => {
      b.forEach((v, k) => {
        v.name = v.bill.customer.name;
        v.bvs_id = v.bill.id;
        v.vendeur = v.user.name;
      });
      this.encaissements = b;
      // console('b', b);
      this.state = false;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getReceipts ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        this.state = false;
        Metro.notify.create('getReceipts ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  printReceipt(e) {
    let p = 0;
    if (e.bill.amount - e.amount > 0) {
      p = e.bill.amount - e.amount;
    } else if (e.bill.amount - e.amount < 0) {
      p = e.bill.amount;
    }
    const opt = {
      bill_id: e.bill.id,
      should_paginate: false,
      'bill_id-gb': 'sum(amount) as total_amount'
    };
    this.api.Receipts.getList(opt).subscribe(d => {
      const com = e.note.split('|');
      const doc = new jsPDF('P', 'mm', [130, 200]);
      doc.setFontSize(6);
      doc.setFontStyle('bold');
      if (com[3] === 'BDC') {
        doc.text('BVS DISTRIBUTION CAMEROUN S.A.S', 6, 5);
        doc.text('BP: 1352 Douala', 6, 8);
      } else {
        doc.text('BVS PRODUCTION CAMEROUN S.A', 6, 5);
        doc.text('BP: 4036 Douala', 6, 8);
      }
      doc.text('Montée BBR - BASSA', 6, 11);
      doc.text('Tél.: 690 404 180/89', 6, 14);
      // info sur le vendeur
      doc.text('Encaissé le : ' + e.received_at, 6, 20);
      doc.text('Imprimé le : ' + moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss'), 6, 23);
      // Client vendeur
      doc.text('ENC-: ' + e.id, 6, 29);
      doc.setFontSize(5);
      doc.text('Client: ' + e.bill.customer.name.toUpperCase(), 6, 32);
      doc.setFontSize(6);
      doc.text('Vendeur: ' + e.vendeur.toUpperCase(), 6, 35);
      doc.text('N° Facture: ' + e.bill.bvs_id, 6, 41);
      doc.text('Avance: ' + this.api.formarPrice(e.amount) + 'FCFA', 6, 44);
      doc.text('Total encaissé: ' + this.api.formarPrice(d[0].total_amount) + 'FCFA', 6, 47);
      doc.text('Reste à payer: ' + this.api.formarPrice(p) + 'FCFA', 6, 50);
      doc.text('Mode de paiement: ' + d[0].payment_method, 6, 56);
      doc.text('Commentaire', 6, 59);
      let index = 0;
      let x = 59;
      doc.setFontSize(5);
      for (const i of com) {
        x += 3;
        index ++;
        if (index < 4) {
          if (d[0].payment_method === 'Espèce') {
            doc.text(i, 6, x);
          } else if (d[0].payment_method === 'Virement') {
            doc.text('Référence: ' + i, 6, x);
          } else if (d[0].payment_method === 'Chèque') {
            if (index === 1) {
              doc.text('N° Chèque: ' + i, 6, x);
            } else if (index === 2) {
              doc.text('Banque: ' + i, 6, x);
            } else {
              doc.text('Date: ' + i, 6, x);
            }
          } else {
            if (index === 1) {
              doc.text('N° Trasanction: ' + i, 6, x);
            } else if (index === 2) {
              doc.text('Opérateur: ' + i, 6, x);
            }
          }
        }
      }
      doc.save( 'bvs_avance_' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss') + '.pdf');
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('printReceipt ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('printReceipt ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }
}
