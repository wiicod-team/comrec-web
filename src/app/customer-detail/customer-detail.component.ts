import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {ActivatedRoute} from '@angular/router';
import * as jsPDF from "jspdf";
import * as moment from 'moment';
declare var Metro;
@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  search = '';
  factures = [];
  old_facture = [];
  selected_bill = [];
  display = 'none';
  user;
  state = false;
  dette = 0;
  isLoadingBills = false;
  throttle = 30;
  scrollDistance = 1;
  scrollUpDistance = 2;
  page = 1;
  max_length = 0;
  old_max_length = 0;
  last_page = 10000000;
  facture: { id: number, avance?: number, amount?: number, name?: string, bvs_id?: number } = {id: 0};
  commentaire;
  montant_avance;
  customer = {
    id: 0,
    name: '',
    status: '',
    echue: 0,
    non_echue: 0,
    sale_network: ''
  };
  per_page = 25;
  constructor(private api: ApiProvider, private route: ActivatedRoute) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    const id = this.route.snapshot.paramMap.get('i');
    this.getCustomer(id);
  }

  ngOnInit(): void {
  }

  getCustomer(id) {
    this.factures = [];
    this.page = 1;
    const load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });
    this.api.Customers.get(id).subscribe(d => {
      this.customer = d.body;
      this.getBills(false, d.body.id);
      Metro.activity.close(load);
    });
  }

  getBills(s, id) {
    let load;
    this.selected_bill = [];
    if (!this.isLoadingBills && this.page <= this.last_page) {
      this.isLoadingBills = true;
      if (s) {
        load = Metro.activity.open({
          type: 'metro',
          overlayColor: '#fff',
          overlayAlpha: 1,
          text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
          overlayClickClose: true
        });
      } else {
        this.state = true;
      }

      const opt = {
        _includes: 'customer,receipts',
        'customer_id': id,
        should_paginate: true,
        _sort: 'created_at',
        _sortDir: 'desc',
        'status-in': ['pending', 'new'],
        per_page: this.per_page,
        page: this.page
      };

      // console.log('option ', opt);

      this.api.Bills.getList(opt).subscribe(
        d => {
          this.customer.echue = 0;
          this.customer.non_echue = 0;
          let av = 0;
          let am = 0;
          this.last_page = d.metadata.last_page;
          this.max_length = d.metadata.total;
          this.old_max_length = this.max_length;
          d.forEach((vv, kk) => {
            am += vv.amount;
            let avance = 0;
            vv.name = vv.customer.name;
            vv.receipts.forEach((vvv, kkk) => {
              avance += vvv.amount;
            });
            vv.avance = avance;
            av += vv.avance;
            if (vv.status === 'pending') {
              vv.statut = 'Echue';
              this.factures.push(vv);
            } else if (vv.status === 'new') {
              vv.statut = 'Non echue';
              this.factures.push(vv);
            }
          });
          this.dette = am - av;
          this.old_facture = this.factures;
          // console.log(this.factures);
          if (s) {
            Metro.activity.close(load);
            this.state = false;
          } else {
            this.state = false;
          }
          this.isLoadingBills = false;
          this.page++;
        }, q => {
          if (q.data.error.status_code === 500) {
            Metro.notify.create('getBills ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          } else if (q.data.error.status_code === 401) {
            Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
          } else {
            Metro.notify.create('getBills ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            if (s) {
              Metro.activity.close(load);
            } else {
              this.state = false;
            }
          }
        });
    }

  }



  onScrollDown(ev) {
    this.getBills(false, this.customer.id);
  }

  onUp(ev) {}


  openBillModal() {
    const tmp = [];
    this.factures.forEach((v, k) => {
      if (v.check) {
        tmp.push(v);
      }
    });
    this.selected_bill = tmp;
    console.log(tmp);
    Metro.dialog.open('#demoDialog1');
  }

  validerEncaissement() {
    this.state = true;
    // actualisation
    let i = 0;
    this.selected_bill.forEach(f => {
      f.status = 'paid';
      f.put().subscribe(d => {
        this.api.Receipts.post({bill_id: f.id, amount: f.amount - f.avance, note: 'Soldé', user_id: this.user.id}).subscribe(da => {
          // console.log('ok', f.id);
          i++;
          Metro.notify.create('Facture ' + f.bvs_id + ' encaissée', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
          if (i === this.selected_bill.length) {
            // impression
            const e = {
              created_at: da.body.created_at,
              vendeur_id: this.user.id,
              vendeur: this.user.name,
              client: f.name,
              id: da.body.id
            };
            this.printEncaissement(e, this.selected_bill);
            // arret du loading
            this.state = false;
          }
        });
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('validerEncaissement ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
        } else {
          Metro.notify.create('validerEncaissement ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          this.state = false;
        }
      });
    });
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
    } else if (f.length === 0) {
      // pas de factures selectionnées
      Metro.notify.create('Pas de facture selectionnée', 'Absence de facture', {cls: 'bg-gris'});
    } else {
      // plus d'une facture selectionnée
      Metro.notify.create('Vous ne pouvez faire d\'avance sur plus d\'une facture', 'Trop de facture', {cls: 'bg-gris'});
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
      console.log(d);
      Metro.notify.create('Encaissement validé', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
      if (this.montant_avance >= (this.facture.amount - this.facture.avance)) {
        // modification du statut de la facture
        this.api.Bills.get(this.facture.id).subscribe(data => {
          data.status = 'paid';
          data.id = data.body.id;
          data.put().subscribe(datap => {
            this.state = false;
            const e = {
              id: datap.body.id,
              note: this.commentaire,
              created_at: data.body.created_at,
              vendeur_id: this.user.id,
              vendeur: this.user.name,
              bill_id: this.facture.bvs_id,
              client: this.facture.name,
              avance: this.montant_avance,
              amount: this.facture.amount
            };
            console.log(e.amount , e.avance , this.montant_avance);
            this.printAvance(e);
          }, q => {
            if (q.data.error.status_code === 500) {
              Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            } else if (q.data.error.status_code === 401) {
              Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
            } else {
              Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
              this.state = false;
            }
          });
        }, q => {
          if (q.data.error.status_code === 500) {
            Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          } else if (q.data.error.status_code === 401) {
            Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
          } else {
            Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
            this.state = false;
          }
        });
      } else {
        this.state = false;
        const e = {
          id: d.body.id,
          note: this.commentaire,
          created_at: d.body.created_at,
          vendeur_id: this.user.id,
          vendeur: this.user.name,
          bill_id: this.facture.bvs_id,
          client: this.facture.name,
          avance: this.montant_avance ,
          amount: this.facture.amount
        };
        console.log(e.amount , e.avance , this.montant_avance);
        this.printAvance(e);
      }
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
        this.state = false;
      }
    });
  }


  printAvance(e) {
    let doc = new jsPDF('P', 'mm', [130, 200]);
    doc.setFontSize(6);
    doc.setFontStyle('bold');
    // doc.setCreationDate(new Date());
    doc.text('BVS DISTRIBUTION CAMEROUN S.A.S', 6, 5);
    doc.text('BP: 1352 Douala', 6, 8);
    doc.text('Montée BBR - BASSA', 6, 11);
    doc.text('Tél.: 690 404 180/89', 6, 14);
    // info sur le vendeur
    doc.text('Avancé le : ' + e.created_at, 6, 17);
    doc.text('Imprimé le : ' + moment(new Date()).format('YYYY-MM-DD HH:mm'), 6, 20);
    // Client vendeur
    doc.text('A-' + e.id + '-' + moment(new Date()).format('YYMMDD'), 6, 23);
    doc.setFontSize(5);
    doc.text('Client: ' + e.client.toUpperCase(), 6, 26);
    doc.setFontSize(6);
    doc.setFontSize(5);
    doc.text('Vendeur: ' + e.vendeur.toUpperCase(), 6, 29);
    doc.setFontSize(6);
    doc.text('N° Facture: ' + e.bill_id, 6, 32);
    doc.text('Avance: ' + this.api.formarPrice(e.avance) + ' FCFA', 6, 35);
    doc.text('Reste: ' + this.api.formarPrice((e.amount - e.avance - this.facture.avance)) + ' FCFA', 6, 37);
    doc.text('Commentaire: ' + e.note, 6, 40);
    doc.save('bvs_avance_' + moment(new Date()).format('YYMMDDHHmmss') + '.pdf');
    this.factures = [];
    this.page = 1;
    this.getBills(false, this.customer.id);
  }

  printEncaissement(e, bills) {
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
    doc.text('E-' + e.id + '-' + moment(new Date()).format('YYMMDD'), 6, 29);
    doc.setFontSize(5);
    doc.text('Client: ' + e.client.toUpperCase(), 6, 32);
    doc.setFontSize(6);
    doc.text('Vendeur: ' + e.vendeur.toUpperCase(), 6, 35);

    doc.text('Factures ', 6, 41);
    let x = 43;
    let a = 0;
    bills.forEach((v, k) => {
      doc.text(v.bvs_id, 6, x);
      a += v.amount;
      x += 3;
    });

    doc.text('Montant versé: ' + this.api.formarPrice(a) + ' FCFA', 6, x);
    doc.save('bvs_encaissement_' + moment(new Date()).format('YYMMDDHHmmss') + '.pdf');
    this.factures = [];
    this.page = 1;
    this.getBills(false, this.customer.id);
  }

  vide() {
    if (this.search === '' || this.search === undefined) {
      this.factures = this.old_facture;
      this.max_length = this.old_max_length;
    }
  }

  rechercher() {
    if (this.search === '' || this.search === undefined) {
      this.factures = this.old_facture;
      this.max_length = this.old_max_length;
    } else {
      console.log(this.search);
      this.page = 1;
      this.state = true;
      this.factures = [];
      const opt = {
        _includes: 'customer,receipts',
        'customer_id-in': this.customer.id,
        should_paginate: true,
        _sort: 'created_at',
        _sortDir: 'desc',
        'bvs_id-lk': this.search,
        'status-in': ['pending', 'new'],
        per_page: this.per_page,
        page: this.page
      };

      this.api.Bills.getList(opt).subscribe(
        d => {
          console.log(d);
          this.last_page = d.metadata.last_page;
          this.max_length = d.metadata.total;
          d.forEach((vv, kk) => {
            let avance = 0;
            vv.name = vv.customer.name;
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
          this.isLoadingBills = false;
          this.page++;
          this.state = false;
        }, q => {
          if (q.data.error.status_code === 500) {
            Metro.notify.create('getBills ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          } else if (q.data.error.status_code === 401) {
            Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
          } else {
            Metro.notify.create('getBills ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
          }
        }
      );
    }
  }
}
