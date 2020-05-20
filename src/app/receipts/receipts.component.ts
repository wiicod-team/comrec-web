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
  max_length = 0;
  old_max_length = 0;
  search;
  order = '';
  page = 1;
  last_page = 10000000;
  montant = 0;
  filtre = 'bill_id';
  per_page = 25;
  state = false;
  isLoadingBills = false;
  throttle = 30;
  scrollDistance = 1;
  scrollUpDistance = 2;

  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;
  constructor( private api: ApiProvider, private route: ActivatedRoute) {
    this.search = '';
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.getReceipts();
  }

  vide() {
    if (this.search === '' || this.search === undefined) {
      this.encaissements = this.old_encaissements;
      this.max_length = this.old_max_length;
    }
  }

  rechercher() {
    this.page = 1;
    this.state = true;
    this.encaissements = [];
    const opt = {
      _includes: 'bill.customer,user',
      should_paginate: true,
      _sort: 'received_at',
      _sortDir: 'desc',
      per_page: this.per_page,
      page: this.page
    };
    if (this.search === '' || this.search === undefined) {
      this.encaissements = this.old_encaissements;
      this.max_length = this.old_max_length;
    } else if (this.filtre === 'bill_id') {
      opt['bill-fk'] = 'bvs_id-lk=' + this.search;
    } else if (this.filtre === 'customer_id') {
      opt['bill-fk'] = 'customer_id-lk=' + this.search;
    } else {
      opt[this.filtre] = this.search;
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

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  onScrollDown(ev) {
    this.getReceipts();
  }

  onUp(ev) {
  }


  getReceipts() {
    this.state = true;
    if (!this.isLoadingBills && this.page <= this.last_page) {
      this.isLoadingBills = true;

      const opt = {
        _includes: 'bill.customer,user',
        _sort: 'received_at',
        should_paginate: true,
        _sortDir: 'desc',
        per_page: this.per_page,
        page: this.page
      };
      this.api.Receipts.getList(opt).subscribe(b => {
        this.last_page = b.metadata.last_page;
        this.max_length = b.metadata.total;
        this.old_max_length = this.max_length;
        b.forEach((v, k) => {
          v.bill.customer.name = v.bill.customer.name.trim();
          v.name = v.bill.customer.name;
          this.montant += v.amount;
          v.bvs_id = v.bill.id;
          v.vendeur = v.user.name;
        });
        this.encaissements = b;
        this.old_encaissements = this.encaissements;
        this.state = false;
        this.isLoadingBills = false;
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
      doc.text('Reste à payer: ' + this.api.formarPrice((e.bill.amount - d[0].total_amount)) + 'FCFA', 6, 50);
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

  show(newValue) {
    this.per_page = newValue;
    this.getReceipts();
  }

  editReceipt(i) {
    Metro.toast.create('Fonctionnalité encours d\'implémentation');
  }

  exportCsv() {
    let csv = '#,Numéro facture,Date,#client,Client,Montant,Mode de paiement,#Vendeur,Vendeur\n';
    this.encaissements.forEach(e => {
      csv += e.id + ',' + e.bill.bvs_id + ',' + e.bill.customer_id + ',' + e.bill.customer.name + ',' + e.amount + ',' + e.payment_method + ',' + e.user_id + ',' + e.user.name;
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, 'BC_encaissements' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss'));
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'BC_encaissements' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
