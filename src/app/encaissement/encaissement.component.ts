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
      console.log('b', b);
      Metro.activity.close(load);
    }, q => {
      Metro.activity.close(load);
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  print(e) {
    let doc = new jsPDF('P', 'mm', [130, 200]);
    doc.setFontSize(6);
    doc.setFontStyle('bold');
    // doc.setCreationDate(new Date());
    doc.text('BVS DISTRIBUTION CAMEROUN S.A.S', 6, 5);
    doc.text('BP: 1352 Douala', 6, 8);
    doc.text('Montée BBR - BASSA', 6, 11);
    doc.text('Tél.: 690 404 180/89', 6, 14);
    // info sur le vendeur
    doc.text('Encaissé le : ' + e.created_at, 6, 17);
    doc.text('Imprimé le : ' + moment(new Date()).format('YYYY-MM-DD hh:mm:ss'), 6, 20);
    // Client vendeur
    doc.text('ENC-: ' + e.id, 6, 23);
    doc.text('Client: ' + e.bill.customer.name, 6, 26);
    doc.text('Vendeur: ' + e.vendeur, 6, 29);
    doc.text('N° Facture: ' + e.bill.id, 6, 32);
    doc.text('Avance: ' + this.api.formarPrice(e.amount) + 'FCFA', 6, 35);
    doc.text('Reste: ' + this.api.formarPrice((e.bill.amount - e.amount)) + 'FCFA', 6, 37);
    doc.save('two-by-four.pdf');
  }
}
