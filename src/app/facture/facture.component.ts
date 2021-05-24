import {Component, OnInit} from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import * as _ from 'lodash';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxRolesService} from 'ngx-permissions';

declare var Metro;

@Component({
  selector: 'app-facture',
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.scss']
})
export class FactureComponent implements OnInit {
  search = '';
  factures = [];
  users = {};
  sellers = [];
  entite: string;
  montant = 0;
  old_facture = [];
  selected_bill = [];
  filtre = 'bvs_id-lk';
  order = '';
  user_name = '';
  display = 'none';
  user;
  user_id;
  state = false;
  isLoadingBills = false;
  throttle = 30;
  scrollDistance = 1;
  scrollUpDistance = 2;
  page = 1;
  max_length = 0;
  old_max_length = 0;
  last_page = 10000000;
  facture: { id: number, avance?: number, amount?: number, name?: string, bvs_id?: number, reste?: number } = {id: 0};
  payment_method = '';
  commentaire1 = '';
  commentaire2 = '';
  commentaire3: any;
  montant_avance;
  today = new Date();
  per_page = 500;
  customer_id = 0;

  constructor(private api: ApiProvider, private route: ActivatedRoute, private router: Router) {
    //console.log(moment(this.today).format('YYYY-MM-DD') + '' +  moment(new Date()).utcOffset(1).format('HH:mm:ss'));
    this.entite = 'BDC';
    this.customer_id = parseInt(this.route.snapshot.paramMap.get('customer_id'));
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    this.commentaire3 = new Date();
  }

  async ngOnInit() {
    this.state = true;
    if (this.customer_id === 0) {
      document.getElementById('fac').style.marginTop = '52px';
    } else {
      this.user_id = this.user.id;
      this.user_name = this.user.name;
    }
    // this.userCustomerIds = await this.getUserCustomerIds(this.user.id);
    this.getBills(false);
    this.getUsers();
  }

  vide() {
    // console.log(this.per_page);
    this.selected_bill = [];
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
      this.page = 1;
      this.state = true;
      this.factures = [];
      const opt = {
        _includes: 'customer,receipts',
        customer_id: this.customer_id,
        should_paginate: true,
        _sort: 'created_at',
        _sortDir: 'desc',
        // 'status-not_in': 'paid',
        per_page: this.per_page,
        page: this.page
      };
      if (this.customer_id === 0) {
        delete opt.customer_id;
      }
      if (this.filtre === 'customer_bvs_id') {
        opt['customer-fk'] = 'bvs_id=' + this.search.trim();
      } else {
        opt[this.filtre] = this.search.trim();
      }
      this.handleBills(opt);
    }
  }

  getBills(s) {
    let load;
    if (s) {
      this.selected_bill = [];
      this.factures = [];
      this.page = 1;
    }
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
        customer_id: this.customer_id,
        should_paginate: true,
        _sort: 'creation_date',
        _sortDir: 'desc',
        // 'status-not_in': 'paid',
        per_page: this.per_page,
        page: this.page
      };

      if (this.customer_id === 0) {
        delete opt.customer_id;
      }
      this.handleBills(opt);
    }

  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  onScrollDown(ev) {
    this.getBills(false);
  }

  onUp(ev) {
  }

  getUsers() {
    const x = {};
    const opt = {
      should_paginate: false,
      _includes: 'roles'
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

  openBillModal() {
    this.payment_method = '';
    this.commentaire1 = '';
    this.commentaire2 = '';

    // console.log(f);
    if (this.selected_bill.length > 0) {
      // console.log(this.selected_bill);
      Metro.dialog.open('#demoDialog1');
    } else {
      // pas de factures selectionnées
      Metro.notify.create('Pas de facture selectionnée', 'Absence de facture', {cls: 'bg-gris'});
    }
  }

  billChecked(bill, val) {
    if (this.montant === 0) {
      // console.log(this.montant, this.selected_bill.length);
      this.selected_bill = [];
    }
    bill.check = val;
    if (val) {
      this.montant += (bill.amount);
      this.selected_bill.push(bill);
    } else {
      this.montant -= (bill.amount);
      this.selected_bill.splice(this.selected_bill.indexOf(bill), 1);
    }
  }

  validerEncaissement() {
    if (this.checkNote()) {
      if (this.customer_id === 0) {
        this.user_name = this.sellers.find(i => i.id == this.user_id).name;
      }
      document.getElementById('non').click();
      this.commentaire3 = moment(this.commentaire3);
      this.state = true;
      // actualisation
      let i = 0;
      this.selected_bill.forEach(f => {
        f.received_at = moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss');
        f.status = 'paid';
        f.put().subscribe(d => {
          const note = this.commentaire1 + '|' + this.commentaire2 + '|' + this.commentaire3.format('DD/MM/YYYY') + '|' + this.entite;
          const opt1 = {
            bill_id: f.id,
            amount: f.amount,
            note,
            received_at : moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss'),
            payment_method: this.payment_method,
            user_id: this.user_id
          };
          this.api.Receipts.post(opt1).subscribe(da => {
            i++;
            Metro.notify.create('Facture ' + f.bvs_id + ' encaissée', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
            if (i === this.selected_bill.length) {
              // impression
              const e = {
                received_at: da.body.received_at,
                vendeur_id: this.user_id,
                vendeur: this.user_name,
                client: f.name,
                note: this.commentaire1 + '|' + this.commentaire2 + '|' + this.commentaire3.format('DD/MM/YYYY'),
                payment_method: this.payment_method,
                id: da.body.id
              };
              console.log(e);
              this.printEncaissement(e, this.selected_bill);
              // arret du loading
              this.state = false;
              this.montant = 0;
            }
          });
        }, q => {
          if (q.data.error.status_code === 500) {
            Metro.notify.create('validerEncaissement ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {
              cls: 'alert',
              keepOpen: true,
              width: 500
            });
          } else if (q.data.error.status_code === 401) {
            Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {
              cls: 'alert',
              keepOpen: true,
              width: 300
            });
          } else {
            Metro.notify.create('validerEncaissement ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {
              cls: 'alert',
              keepOpen: true,
              width: 500
            });
            this.state = false;
          }
        });

      });
    }
  }

  avancer() {
    this.payment_method = '';
    this.commentaire1 = '';
    this.commentaire2 = '';
    this.montant_avance = 0;
    if (this.selected_bill.length >= 1 && this.selected_bill.length < 2) {
      this.facture = this.selected_bill[0];
      // console.log(this.facture);
      Metro.dialog.open('#avanceDialog1');
    } else if (this.selected_bill.length === 0) {
      // pas de factures selectionnées
      Metro.notify.create('Pas de facture selectionnée', 'Absence de facture', {cls: 'bg-gris'});
    } else {
      // plus d'une facture selectionnée
      Metro.notify.create('Vous ne pouvez faire d\'avance sur plus d\'une facture', 'Trop de facture', {cls: 'bg-gris'});
    }
  }

  validerAvance() {
    if (this.checkNote()) {
      if (this.customer_id === 0) {
        this.user_name = this.sellers.find(i => i.id == this.user_id).name;
      }
      document.getElementById('close').click();
      this.state = true;
      this.commentaire3 = moment(this.commentaire3);
      const opt = {
        amount: this.montant_avance,
        note: this.commentaire1 + '|' + this.commentaire2 + '|' + this.commentaire3.format('DD/MM/YYYY') + '|' + this.entite,
        payment_method: this.payment_method,
        bill_id: this.facture.id,
        user_id: this.user_id,
        received_at: moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss')
      };
      this.api.Receipts.post(opt).subscribe(d => {
        Metro.notify.create('Encaissement validé', 'Succès', {cls: 'bg-or fg-white', timeout: 5000});
        if (this.montant_avance >= (this.facture.amount)) {
          // modification du statut de la facture
          this.api.Bills.get(this.facture.id).subscribe(data => {
            data.status = 'paid';
            data.id = data.body.id;
            data.put().subscribe(datap => {
              this.state = false;
              const e = {
                id: datap.body.id,
                note: this.commentaire1 + '|' + this.commentaire2 + '|' + this.commentaire3.format('DD/MM/YYYY'),
                received_at: data.body.received_at,
                vendeur_id: this.user_id,
                vendeur: this.user_name,
                bill_id: this.facture.bvs_id,
                client: this.facture.name,
                reste: this.facture.reste - this.montant_avance,
                payment_method: this.payment_method,
                avance: this.montant_avance,
                amount: this.facture.amount
              };
              this.printAvance(e);
              this.montant = 0;
            }, q => {
              console.log('C');
              if (q.data.error.status_code === 500) {
                Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {
                  cls: 'alert',
                  keepOpen: true,
                  width: 500
                });
              } else if (q.data.error.status_code === 401) {
                Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>', 'Session Expirée ' + q.data.error.status_code, {
                  cls: 'alert',
                  keepOpen: true,
                  width: 300
                });
              } else {
                Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {
                  cls: 'alert',
                  keepOpen: true,
                  width: 500
                });
                this.state = false;
              }
            });
          }, q => {
            if (q.data.error.status_code === 500) {
              Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {
                cls: 'alert',
                keepOpen: true,
                width: 500
              });
            } else if (q.data.error.status_code === 401) {
              Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {
                cls: 'alert',
                keepOpen: true,
                width: 300
              });
            } else {
              Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {
                cls: 'alert',
                keepOpen: true,
                width: 500
              });
              this.state = false;
            }
          });
        } else {
          this.state = false;
          const e = {
            id: d.body.id,
            note: this.commentaire1 + '|' + this.commentaire2 + '|' + this.commentaire3,
            received_at: d.body.received_at,
            vendeur_id: this.user_id,
            vendeur: this.user_name,
            bill_id: this.facture.bvs_id,
            client: this.facture.name,
            avance: this.montant_avance,
            payment_method: this.payment_method,
            reste: this.facture.reste - this.montant_avance,
            amount: this.facture.amount
          };
          this.printAvance(e);
          this.montant = 0;
        }
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 500
          });
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 300
          });
        } else {
          Metro.notify.create('validerAvance ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 500
          });
          this.state = false;
        }
      });
    }
  }

  checkNote() {
    console.log(this.entite);
    if (this.payment_method !== '' && this.user_id !== undefined && this.entite !== undefined) {
      if (this.payment_method === 'Espèce' && this.commentaire1 !== '') {
        return true;
      } else if (this.payment_method === 'Espèce' && this.commentaire1 === '') {
        Metro.toast.create('Merci de remplir tous les champs', null, 5000);
        return false;
      } else if (this.payment_method === 'Virement' && this.commentaire1 !== '') {
        return true;
      } else if (this.payment_method === 'Virement' && this.commentaire1 === '') {
        Metro.toast.create('Merci de remplir tous les champs', null, 5000);
        return false;
      } else if (this.payment_method === 'Traite' && this.commentaire1 !== '' && this.commentaire2 !== '' && this.commentaire3 !== '') {
        return true;
      } else if (this.payment_method === 'Traite' && (this.commentaire1 === '' || this.commentaire2 === '' || this.commentaire3 === '')) {
        Metro.toast.create('Merci de remplir tous les champs', null, 5000);
        return false;
      } else if (this.payment_method === 'Chèque' && this.commentaire1 !== '' && this.commentaire2 !== '' && this.commentaire3 !== '') {
        return true;
      } else if (this.payment_method === 'Chèque' && (this.commentaire1 === '' || this.commentaire2 === '' || this.commentaire3 === '')) {
        Metro.toast.create('Merci de remplir tous les champs', null, 5000);
        return false;
      } else if (this.payment_method === 'Paiement mobile' && this.commentaire1 !== '' && this.commentaire2 !== '') {
        return true;
      } else if (this.payment_method === 'Paiement mobile' && (this.commentaire1 === '' || this.commentaire2 === '')) {
        Metro.toast.create('Merci de remplir tous les champs', null, 5000);
        return false;
      }
    } else {
      Metro.toast.create('Merci de remplir tous les champs et de selectionner l\'entité', null, 5000);
      return false;
    }
  }

  printAvance(e) {
    const doc = new jsPDF('P', 'mm', [130, 200]);
    doc.setFontSize(6);
    doc.setFontStyle('bold');
    // doc.setCreationDate(new Date());
    if (this.entite === 'BDC') {
      doc.text('BVS DISTRIBUTION CAMEROUN S.A.S', 6, 5);
      doc.text('BP: 1352 Douala', 6, 8);
    } else {
      doc.text('BVS PRODUCTION CAMEROUN S.A', 6, 5);
      doc.text('BP: 4036 Douala', 6, 8);
    }
    doc.text('Montée BBR - BASSA', 6, 11);
    doc.text('Tél.: 690 404 180/89', 6, 14);
    // info sur le vendeur
    doc.text('Avancé le : ' + e.received_at, 6, 17);
    doc.text('Imprimé le : ' + moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss'), 6, 20);
    // Client vendeur
    doc.text('ENC-' + e.id, 6, 23);
    doc.setFontSize(5);
    doc.text('Client: ' + e.client.toUpperCase(), 6, 26);
    doc.text('Vendeur: ' + e.vendeur.toUpperCase(), 6, 29);
    doc.setFontSize(6);
    doc.text('N° Facture: ' + e.bill_id, 6, 31);
    doc.text('Avance: ' + this.api.formarPrice(e.avance) + ' FCFA', 6, 34);
    doc.text('Reste: ' + this.api.formarPrice((e.amount - e.avance)) + ' FCFA', 6, 37);
    doc.text('Mode de paiement: ' + e.payment_method, 6, 40);
    doc.text('Commentaires', 6, 43);

    if (e.payment_method === 'Espèce') {
      doc.text(this.commentaire1, 6, 46);
    } else if (e.payment_method === 'Virement') {
      doc.text('Référence: ' + this.commentaire1, 6, 46);
    } else if (e.payment_method === 'Chèque') {
      doc.text('N° Chèque: ' + this.commentaire1, 6, 46);
      doc.text('Banque: ' + this.commentaire2, 6, 49);
      doc.text('Date: ' + this.commentaire3.format('DD/MM/YYYY'), 6, 52);
    } else {
      doc.text('N° Transaction: ' + this.commentaire1, 6, 46);
      doc.text('Opérateur: ' + this.commentaire2, 6, 49);
    }

    doc.save('bvs_avance_' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss') + '.pdf');
    this.getBills(false);
    this.commentaire1 = '';
    this.commentaire2 = '';
    this.payment_method = '';
    this.montant_avance = 0;
  }

  printEncaissement(e, bills) {
    const doc = new jsPDF('P', 'mm', [130, 200 + (bills.length * 3)]);
    doc.setFontSize(6);
    doc.setFontStyle('bold');
    if (this.entite === 'BDC') {
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
    doc.text('ENC-' + e.id, 6, 29);
    doc.setFontSize(5);
    doc.text('Client: ' + e.client.toUpperCase(), 6, 32);
    doc.setFontSize(6);
    doc.text('Vendeur: ' + e.vendeur.toUpperCase(), 6, 35);

    doc.text('Factures ', 6, 41);
    let x = 43;
    let a = 0;
    bills.forEach((v, k) => {
      doc.text(v.bvs_id, 6, x);
      a += (v.amount);
      x += 3;
    });

    doc.text('Montant versé: ' + this.api.formarPrice(a) + ' FCFA', 6, x);
    doc.text('Mode de paiement: ' + e.payment_method, 6, x + 3);
    doc.text('Commentaires', 6, x + 6);

    if (e.payment_method === 'Espèce') {
      doc.text(this.commentaire1, 6, x + 9);
    } else if (e.payment_method === 'Virement') {
      doc.text('Référence: ' + this.commentaire1, 6, x + 9);
    } else if (e.payment_method === 'Chèque') {
      doc.text('N° Chèque: ' + this.commentaire1, 6, x + 9);
      doc.text('Banque: ' + this.commentaire2, 6, x + 12);
      doc.text('Date: ' + this.commentaire3.format('DD/MM/YYYY'), 6, x + 15);
    } else {
      doc.text('N° Transaction: ' + this.commentaire1, 6, x + 9);
      doc.text('Opérateur: ' + this.commentaire2, 6, x + 12);
    }

    doc.save('bvs_encaissement_' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss') + '.pdf');
    this.getBills(false);
    this.commentaire1 = '';
    this.commentaire2 = '';
    this.payment_method = '';
  }

  orderBy(text) {
    if (text === this.order) {
      this.factures = _.orderBy(this.factures, text).reverse();
      this.order = '';
    } else {
      this.factures = _.orderBy(this.factures, text);
      this.order = text;
    }
  }

  show(newValue) {
    this.per_page = newValue;
    this.getBills(true);
  }

  getX3Bills() {
    this.api.X3.getList({per_page: 100}).subscribe( d => {
      console.log(d);
    });
    // https://api-izis.bvs-sas.com/api/retrieve-bills
  }

  handleBills(opt) {
    this.api.Bills.getList(opt).subscribe(
      d => {
        //console.log(d);
        this.last_page = d.metadata.last_page;
        this.max_length = d.metadata.total;
        this.old_max_length = this.max_length;
        d.forEach((vv, kk) => {
          let avance = 0;
          vv.name = vv.customer.name.trim();
          vv.receipts = _.sortBy(vv.receipts, 'received_at').reverse();
          vv.receipts.forEach((vvv, kkk) => {
            avance += vvv.amount;
          });
          vv.avance = avance;
          if (vv.receipts.length > 0) {
            const date_r = moment(vv.receipts[0].received_at).add('hour', 2);
            const date_n = moment(new Date());
            // si date de reception supérieure à la date d'encaissement d'une heure
            if (date_r > date_n) {
              // même jour
              vv.reste = vv.amount - vv.receipts[0].amount;
            } else {
              vv.reste = vv.amount;
            }
          } else {
            vv.reste = vv.amount;
          }
          if (vv.reste > 0 && vv.avance !== vv.reste) {
            vv.bool = 1;
          } else {
            vv.bool = 0;
          }
          if (vv.status === 'paid' && vv.bool === 0) {
            vv.statut = 'Payée';
            vv.ordre = 3;
            this.factures.push(vv);
          } else if (vv.status === 'paid' && vv.bool === 1) {
            vv.statut = 'Echue';
            vv.ordre = 2;
            this.factures.push(vv);
          } else if (vv.status === 'remain') {
            vv.statut = 'Avoir';
            vv.ordre = 4;
            this.factures.push(vv);
          } else {
            if (moment(vv.creation_date).add('days', '30') > moment(new Date())) {
              vv.statut = 'Non echue';
              vv.ordre = 1;
            } else {
              vv.statut = 'Echue';
              vv.ordre = 2;
            }
            this.factures.push(vv);
          }
          /*if (vv.reste !== 0) {
            if (vv.reste === vv.avance && vv.status === 'paid') {
              this.max_length--;
            } else {
              if (moment(vv.creation_date).add('days', '30') > moment(new Date())) {
                // facture non echue
                vv.statut = 'Non echue';
                this.factures.push(vv);
              } else {
                vv.statut = 'Echue';
                this.factures.push(vv);
              }
            }
          } else {
            if (vv.status !== 'paid') {
              if (moment(vv.creation_date).add('days', '30') > moment(new Date())) {
                // facture non echue
                vv.statut = 'Non echue';
                this.factures.push(vv);
              } else {
                vv.statut = 'Echue';
                this.factures.push(vv);
              }
            } else {
              this.max_length--;
            }
          }*/
        });
        // order by bool
        this.factures = _.sortBy(this.factures, 'ordre');
        this.isLoadingBills = false;
        this.page++;
        this.state = false;
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('getBills ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 500
          });
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 300
          });
        } else {
          Metro.notify.create('getBills ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 500
          });
        }
      }
    );
  }

  oldHandleBills(opt) {
    this.api.Bills.getList(opt).subscribe(
      d => {
        this.last_page = d.metadata.last_page;
        this.max_length = d.metadata.total;
        this.old_max_length = this.max_length;
        d.forEach((vv, kk) => {
          let avance = 0;
          vv.name = vv.customer.name.trim();
          vv.receipts = _.sortBy(vv.receipts, 'received_at').reverse();
          vv.receipts.forEach((vvv, kkk) => {
            avance += vvv.amount;
          });
          vv.avance = avance;
          if (vv.receipts.length > 0) {
            const date_r = moment(vv.receipts[0].received_at).add('hour', 2);
            const date_n = moment(new Date());
            // si date de reception supérieure à la date d'encaissement d'une heure
            if (date_r > date_n) {
              // même jour
              vv.reste = vv.amount - vv.receipts[0].amount;
            } else {
              vv.reste = vv.amount;
            }
          } else {
            vv.reste = vv.amount;
          }
          if (vv.reste !== 0) {
            if (vv.reste === vv.avance && vv.status === 'paid') {
              this.max_length--;
            } else {
              if (moment(vv.creation_date).add('days', '30') > moment(new Date())) {
                // facture non echue
                vv.statut = 'Non echue';
                this.factures.push(vv);
              } else {
                vv.statut = 'Echue';
                this.factures.push(vv);
              }
            }
          } else {
            if (vv.status !== 'paid') {
              if (moment(vv.creation_date).add('days', '30') > moment(new Date())) {
                // facture non echue
                vv.statut = 'Non echue';
                this.factures.push(vv);
              } else {
                vv.statut = 'Echue';
                this.factures.push(vv);
              }
            } else {
              this.max_length--;
            }
          }
        });
        this.isLoadingBills = false;
        this.page++;
        this.state = false;
      }, q => {
        if (q.data.error.status_code === 500) {
          Metro.notify.create('getBills ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 500
          });
        } else if (q.data.error.status_code === 401) {
          Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 300
          });
        } else {
          Metro.notify.create('getBills ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {
            cls: 'alert',
            keepOpen: true,
            width: 500
          });
        }
      }
    );
  }

  editFacture(fa) {
    console.log(fa);
    //fa.amount = 6778939;
    fa.status = 'pending';
    fa.put();
    // this.api.Permissions.post({display_name:'Comptabilité',name:'comptabilite'});
  }
}
