import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiProvider} from '../providers/api/api';
import * as moment from 'moment';
import * as _ from 'lodash';
import jsPDF from "jspdf";

declare var Metro;
declare global {
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean
  }
}


@Component({
  selector: 'app-cashier',
  templateUrl: './cashier.component.html',
  styleUrls: ['./cashier.component.scss']
})
export class CashierComponent implements OnInit {
  can_validate = true;
  encaissements = [];
  old_encaissements = [];
  user;
  from;
  users = {};
  sellers = [];
  selected_bill = [];
  date_format = 'Y-M-D';
  today = 'du jour';
  now = new Date();
  to;
  deb;
  entite = 'BDC';
  fin;
  bill_id = '';
  user_id = 0;
  max_length = 0;
  old_max_length = 0;
  search;
  order = '';
  montant = 0;
  filtre = 'bill_id';
  state = false;
  isLoadingBills = false;
  cheque = false;
  banque_cheque = '';
  date_cheque: any;
  numero_cheque = '';
  montant_cheque = 0;
  orange = false;
  montant_orange = 0;
  transaction_orange = '';
  mtn = false;
  montant_mtn = 0;
  transaction_mtn = '';
  espece = false;
  montant_espece = 0;
  commentaire_espece = '';
  payment_method = '';
  r: {
    bill: { bvs_id: number, customer: {name: string} },
    received_at: string,
    bill_id: string,
    entite: string,
    vendeur: string,
    note: string,
    status: string,
    type: string,
    payment_method: string,
    amount: number,
    remove(): any
  };

  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;
  constructor( private api: ApiProvider, private route: ActivatedRoute) {
    this.from = new Date();
    this.to = new Date();
    this.date_cheque = new Date();
    this.r = {
      bill: { bvs_id: 0, customer: {name: ''} },
      received_at: '',
      bill_id: '',
      entite: '',
      vendeur: '',
      note: '',
      type: '',
      status: '',
      payment_method: '',
      amount: 0,
      remove: () => {}
    };
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
    this.getUsers();
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
    } else {
      if (this.filtre === 'bill_id') {
        opt['bill-fk'] = 'bvs_id-lk=' + this.search.trim();
      } else if (this.filtre === 'customer_id') {
        opt['bill-fk'] = 'customer_id-lk=' + this.search.trim();
      } else {
        opt[this.filtre] = this.search.trim();
      }
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
      const load = Metro.activity.open({
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
        b.forEach((v, k) => {
          if (v.bill) {
            v.bill.customer.name = v.bill.customer.name.trim();
            v.name = v.bill.customer.name;
            v.bvs_id = v.bill.id;
          } else {
            v.bvs_id = v.note.split('!')[0];
            v.name = 'Encaissement cash';
            v.bill = {
              bvs_id : v.note.split('!')[0],
              customer: {
                name: 'Client boutique'
              }
            };
          }
          this.montant += v.amount;
          v.vendeur = v.user.name;
          if (v.note) {
            const u = v.note.split('!');
            let x = [];
            if (u.length > 1) {
              v.note = u[1];
              x = u[1].split('|');
            } else {
              x = u[0].split('|');
            }
            const y = x[v.note.split('|').length - 1].split('/');
            if (y.length > 1) {
              v.entite = y[1];
            } else {
              v.entite = v.note.split('|')[v.note.split('|').length - 1];
            }
          }
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

  orderBy(text) {
    if (text === this.order) {
      this.encaissements = _.orderBy(this.encaissements, text).reverse();
      this.order = '';
    } else {
      this.encaissements = _.orderBy(this.encaissements, text);
      this.order = text;
    }
  }

  billChecked(bill) {
    if (this.montant === 0) {
      // console.log(this.montant, this.selected_bill.length);
      this.selected_bill = [];
    }
    bill.check = !bill.check;
    if (bill.check) {
      this.montant += (bill.amount);
      this.selected_bill.push(bill);
    } else {
      this.montant -= (bill.amount);
      this.selected_bill.splice(this.selected_bill.indexOf(bill), 1);
    }
  }

  openDeleteModal(i) {
    this.r = i;
    Metro.dialog.open('#deleteDialog');
  }

  openAddReceipt() {
    this.reset();
    Metro.dialog.open('#addReceiptDialog');
  }

  printNewReceipt(e) {
    //console.log(e);
    this.api.printNewReceipt(e);
  }

  reset() {
    this.montant_orange = 0;
    this.montant_mtn = 0;
    this.montant_espece = 0;
    this.montant_cheque = 0;
    this.bill_id = '';
    this.can_validate = true;
    this.payment_method = '';
  }

  addReceipt() {
    this.can_validate = false;
    if (this.cheque) {
      this.payment_method += 'Chèque, ';
    }
    if (this.espece) {
      this.payment_method += 'Espèce, ';
    }
    if (this.orange) {
      this.payment_method += 'Orange Money, ';
    }
    if (this.mtn) {
      this.payment_method += 'MTN Mobile Money, ';
    }
    const opt1 = {
      note: this.bill_id + '!',
      type: 'shop',
      status: 'validated',
      payment_method: '',
      amount: 0,
      received_at : moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss'),
      user_id: this.user_id
    };

    if (this.espece) {
      opt1.payment_method += 'Espèce, ';
      opt1.amount += this.montant_espece;
      opt1.note += 'Mode de paiement: Espèce, Montant: ' + this.montant_espece + ', Commentaire: ' + this.commentaire_espece + ' | ';
    }
    if (this.cheque) {
      opt1.payment_method += 'Chèque, ';
      opt1.amount += this.montant_cheque;
      opt1.received_at = moment(new Date(this.date_cheque)).utcOffset(1).format('YYYY-MM-DD') + ' ' +  moment(new Date()).utcOffset(1).format('HH:mm:ss');
      opt1.note += 'Mode de paiement: Chèque, Montant: ' + this.montant_cheque + ', Date: ' + moment(new Date(this.date_cheque)).utcOffset(1).format('DD-MM-YYYY') + ', Banque: ' + this.banque_cheque + ', Numéro chèque: ' + this.numero_cheque + ' | ';
    }
    if (this.orange) {
      opt1.payment_method += 'Orange Money, ';
      opt1.amount += this.montant_orange;
      opt1.note += 'Mode de paiement: Orange Money , Montant: ' + this.montant_orange + ', Numéro transaction: ' + this.transaction_orange + ' | ';
    }
    if (this.mtn) {
      opt1.payment_method += 'MTN Mobile Money, ';
      opt1.amount += this.montant_mtn;
      opt1.note += 'Mode de paiement: MTN Mobile Money, Montant: ' + this.montant_mtn + ', Numéro transaction: ' + this.transaction_mtn + ' | ';
    }
    opt1.note += ' / ' + this.entite;
    this.api.Receipts.post(opt1).subscribe(da => {
      // reset
      document.getElementById('close').click();
      Metro.notify.create('Facture encaissée', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
    });



  }

  deleteReceipt() {
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

  cancelReceipt(v) {
    v.status = 'pending';
    v.put().subscribe((d: any) => {
      Metro.toast.create('Statut mis à jour');
    });
  }

  validateReceipt() {
    if (this.selected_bill.length > 0) {
      this.selected_bill.forEach((v, k) => {
        v.status = 'validated';
        v.put().subscribe((d: any) => {
          Metro.toast.create('Statut mis à jour');
        });
      });
    } else {
      Metro.toast.create('Aucun encaissement selectionné');
    }
  }

  exportCsv() {
    let csv = '#,.Facture,.Date,.Client,.Montant,.Type,.Statut,.Mode de paiement,.Entite,.Vendeur,.Reseau,.Commentaire\n';
    this.encaissements.forEach(e => {
      csv += e.id + ',.' + e.bill.bvs_id + ',.' + e.created_at + ',.' + e.bill.customer.name + ',.' + e.amount + ',.' + e.type + ',.' + e.status + ',.'
        + e.payment_method + ',.' + e.entite + ',.' + e.user.name + ',.' + e.user.network + ',.' + e.note;
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

  getUsers() {
    const x = {};
    const opt = {
      should_paginate: false,
      _includes: 'roles',
      _sort: 'name',
      _sortDir: 'asc',
      status: 'enable'
    };
    this.api.Users.getList(opt).subscribe(d => {
      this.sellers = d;
      d.forEach(v => {
        if (v.roles !== undefined && v.roles.find(a => a.name === 'vendeurs.bvs') !== undefined) {
          x[v.id] = v.name;
        }
      });
      this.users = x;
    });
  }

}
