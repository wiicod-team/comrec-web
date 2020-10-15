import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {ActivatedRoute} from '@angular/router';
import * as moment from 'moment';
import * as jsPDF from 'jspdf';
import * as _ from 'lodash';

declare var Metro;
@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.scss']
})
export class ReceiptsComponent implements OnInit {

  encaissements = [];
  old_encaissements = [];
  user;
  from;
  date_format = 'Y-M-D';
  today = 'du jour';
  now = new Date();
  to;
  deb;
  fin;
  max_length = 0;
  old_max_length = 0;
  search;
  order = '';
  montant = 0;
  filtre = 'bill_id';
  state = false;
  isLoadingBills = false;
  r: {
    bill: { bvs_id: number, customer: {name: string} },
    received_at: string,
    bill_id: string,
    entite: string,
    vendeur: string,
    note: string,
    payment_method: string,
    amount: number,
    remove(): any
  };

  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;
  constructor( private api: ApiProvider, private route: ActivatedRoute) {
    this.from = new Date();
    this.to = new Date();
    this.r = {
      bill: { bvs_id: 0, customer: {name: ''} },
      received_at: '',
      bill_id: '',
      entite: '',
      vendeur: '',
      note: '',
      payment_method: '',
      amount: 0,
      remove: () => {}
    }
    const date = new Date();
    const j = date.getDay();
    let d = j % 7;
    let f = 6 - j % 7;
    if (d === 0) {
      d = 7;
      f = -1;
    }
    this.search = '';
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.init(moment(new Date()), moment(new Date()));
  }

  init(deb, fin) {
    this.montant = 0;
    this.deb = moment(deb);
    this.fin = moment(fin);
    this.getReceipts();
  }

  vide() {
    if (this.search === '' || this.search === undefined) {
      this.encaissements = this.old_encaissements;
      this.max_length = this.old_max_length;
    }
  }

  rechercher() {
    this.montant = 0;
    this.state = true;
    this.encaissements = [];
    const opt = {
      _includes: 'bill.customer,user',
      _sort: 'received_at',
      _sortDir: 'desc',
    };
    if (this.search === '' || this.search === undefined) {
      this.encaissements = this.old_encaissements;
      this.max_length = this.old_max_length;
    } else if (this.filtre === 'bill_id') {
      opt['bill-fk'] = 'bvs_id-lk=' + this.search.trim();
    } else if (this.filtre === 'customer_id') {
      opt['bill-fk'] = 'customer_id-lk=' + this.search.trim();
    } else {
      opt[this.filtre] = this.search.trim();
    }
    this.api.Receipts.getList(opt).subscribe(b => {
      b.forEach((v, k) => {
        v.name = v.bill.customer.name;
        this.montant += v.amount;
        v.bvs_id = v.bill.id;
        v.vendeur = v.user.name;
      });
      this.encaissements = b;
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

  ngOnInit() {
    moment.locale('fr');
  }

  getReceipts() {
    this.montant = 0;
    this.state = true;
    if (!this.isLoadingBills) {
      this.isLoadingBills = true;
      let load = Metro.activity.open({
        type: 'metro',
        overlayColor: '#fff',
        overlayAlpha: 1,
        text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
        overlayClickClose: true
      });

      const opt = {
        _includes: 'bill.customer,user',
        _sort: 'received_at',
        should_paginate: false,
        'received_at-get': this.deb.format(this.date_format),
        'received_at-let': this.fin.format(this.date_format),
        _sortDir: 'desc',
      };
      this.api.Receipts.getList(opt).subscribe(b => {
        //console.log(b);
        b.forEach((v, k) => {
          v.bill.customer.name = v.bill.customer.name.trim();
          v.name = v.bill.customer.name;
          this.montant += v.amount;
          v.bvs_id = v.bill.id;
          v.vendeur = v.user.name;
          v.entite = v.note.split('|')[v.note.split('|').length - 1];
        });
        this.encaissements = b;
        this.old_encaissements = this.encaissements;
        this.state = false;
        this.isLoadingBills = false;
        Metro.activity.close(load);
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
      doc.text('N° encaissement: ' + e.bill.bvs_id, 6, 41);
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

  orderBy(text) {
    if (text === this.order) {
      this.encaissements = _.orderBy(this.encaissements, text).reverse();
      this.order = '';
    } else {
      this.encaissements = _.orderBy(this.encaissements, text);
      this.order = text;
    }
  }

  openDeleteModal(i) {
    this.r = i;
    Metro.dialog.open('#deleteDialog');
  }

  cancelReceipt() {
    console.log(this.r);
    // suppression du receipt et modification de la facture à echue
    this.r.remove().subscribe(d => {
      this.api.Bills.get(this.r.bill_id).subscribe(da => {
        da.id = da.body.id;
        da.status = 'pending';
        da.put().subscribe(a => {
          Metro.toast.create('Encaissement annulé');
          this.getReceipts();
        });
      });
    });
  }

  exportCsv() {
    let csv = '#,Facture,Date,Client,Montant,Mode de paiement,Entite,Vendeur,Reseau\n';
    this.encaissements.forEach(e => {
      csv += e.id + ',' + e.bill.bvs_id + ',' + e.created_at + ',' + e.bill.customer.name + ',' + e.amount + ','
        + e.payment_method + ',' + e.entite + ',' + e.user.name + ',' + e.user.network;
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, 'BC_encaissements' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss') + '.csv');
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'BC_encaissements' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss') + '.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  period() {
    Metro.dialog.open('#periodDialog');
  }

  validate() {
    this.from = new Date(this.from);
    this.to = new Date(this.to);
    this.today = 'du ' + moment(this.from).format('DD/MM/YYYY') + ' au ' + moment(this.to).format('DD/MM/YYYY');
    this.init(this.from, this.to);
  }
}
