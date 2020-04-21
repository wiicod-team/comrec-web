import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';
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
  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;
  constructor( private api: ApiProvider) {
    this.search = '';
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.getReceipts();
  }

  ngOnInit() {
    moment.locale('fr');
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
      // console('b', b);
      Metro.activity.close(load);
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getReceipts ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.activity.close(load);
        Metro.notify.create('getReceipts ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  printReceipt(e) {
    let doc = new jsPDF('P', 'mm', [130, 200]);
    doc.setFontSize(6);
    doc.setFontStyle('bold');
    // doc.setCreationDate(new Date());
    doc.text('BVS DISTRIBUTION CAMEROUN S.A.S', 6, 5);
    doc.text('BP: 1352 Douala', 6, 8);
    doc.text('Montée BBR - BASSA', 6, 11);
    doc.text('Tél.: 690 404 180/89', 6, 14);
    // info sur le vendeur
    doc.text('Encaissé le : ' + e.created_at, 6, 20);
    doc.text('Imprimé le : ' + moment(new Date()).format('YYYY-MM-DD HH:mm'), 6, 23);
    // Client vendeur
    doc.text('ENC-: ' + e.id, 6, 29);
    doc.text('Client: ' + e.bill.customer.name, 6, 32);
    doc.text('Vendeur: ' + e.vendeur, 6, 35);
    doc.text('N° Facture: ' + e.bill.bvs_id, 6, 38);
    doc.text('Avance: ' + this.api.formarPrice(e.amount) + 'FCFA', 6, 41);
    doc.text('Reste: ' + this.api.formarPrice((e.bill.amount - e.amount)) + 'FCFA', 6, 44);
    doc.save( 'bvs_avance_' + moment(new Date()).format('YYMMDDHHmmss') + '.pdf');
  }
}
