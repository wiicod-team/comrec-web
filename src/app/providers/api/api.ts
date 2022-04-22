import {Injectable} from '@angular/core';
import {Restangular} from 'ngx-restangular';
import {Router} from '@angular/router';
import jsPDF from "jspdf";
import * as moment from 'moment';
declare var Metro;
/*
  Generated class for the ApiProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/

@Injectable()
export class ApiProvider {

  public Bills: any = this.restangular.service('bills');
  public X3: any = this.restangular.service('retrieve-bills');
  public Customers: any = this.restangular.service('customers');
  public CustomerUsers: any = this.restangular.service('customer_users');
  public PermissionRoles: any = this.restangular.service('permission_roles');
  public Permissions: any = this.restangular.service('permissions');
  public Receipts: any = this.restangular.service('receipts');
  public Roles: any = this.restangular.service('roles');
  public Users: any = this.restangular.service('users');
  public RoleUsers: any = this.restangular.service('role_users');
  public me: any = this.restangular.one('auth/me');

  public date_format = 'Y-M-D';

  public autoplay_val = 5000;
  public slide_speed = 700;

  constructor(public restangular: Restangular, private router: Router) {
    restangular.withConfig((RestangularConfigurer) => {});
  }

  formarPrice(price) {
    if (price === undefined) {
      return '';
    } else {
      price += '';
      const tab = price.split('');
      let p = '';
      for (let i = tab.length; i > 0; i--) {
        if (i % 3 === 0) {
          p += ' ';
        }
        p += tab[tab.length - i];
      }
      return p;
    }
  }

  checkUser() {
    if (JSON.parse(localStorage.getItem('user')) == null) {
      Metro.notify.create('Vous n\'êtes pas connecté', 'Erreur de connexion', {cls: 'alert'});
      this.router.navigate(['/login']);
    } else {
      // rien
      // verification si le mot de passe a été reset
      if (!JSON.parse(localStorage.getItem('user')).has_reset_password) {
        this.router.navigate(['/reset', JSON.parse(localStorage.getItem('user')).id]);
      }
    }
  }

  printNewReceipt(e) {
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
    this.Receipts.getList(opt).subscribe(d => {
      const x = e.note.split('/');
      const y = x[0].split('|');
      let count = 0;
      for (let i = 0; i < y.length; i++) {
        const z = y[i].split(',');
        for (let j = 0; j < z.length; j++) {
          count += 3;
        }
        count += 2;
      }
      const h = 60 + (count);
      console.log(h);
      //const doc = new jsPDF('p', 'mm', [150, h]);
      const doc = new jsPDF(
        {
          orientation: "p",
          unit: "mm",
          format: [58, h]
        }
      );
      doc.setFontSize(6);
      // @ts-ignore
      //doc.setFontStyle('bold');
      if (e.entite.trim() === 'BDC') {
        doc.text('BVS DISTRIBUTION CAMEROUN S.A.S', 6, 5);
        doc.setFontSize(5);
        doc.text('BP: 1352 Douala', 6, 7);
      } else {
        doc.text('BVS PRODUCTION CAMEROUN S.A', 6, 5);
        doc.setFontSize(5);
        doc.text('BP: 4036 Douala', 6, 7);
      }
      doc.text('Montée BBR - BASSA', 6, 9);
      doc.text('Tél.: 690 404 180/89', 6, 11);
      doc.setFontSize(6);
      doc.text('**************************************************', 6, 15);
      // info sur le vendeur
      doc.text('Avancé le : ' + e.received_at, 6, 19);
      doc.text('Imprimé le : ' + moment(new Date()).utcOffset(1).format('YYYY-MM-DD HH:mm:ss'), 6, 22);
      // Client vendeur
      doc.text('ENC-' + e.id, 6, 28);
      doc.text('Client: ' + e.bill.customer.name.toUpperCase(), 6, 31);
      doc.text('Vendeur: ' + e.vendeur.toUpperCase(), 6, 34);
      doc.text('N° Facture: ' + e.bill.bvs_id, 6, 37);
      doc.text('Avance: ' + this.formarPrice(e.amount) + ' FCFA', 6, 43);
      doc.text('Total encaissé: ' + this.formarPrice(d[0].total_amount) + ' FCFA', 6, 46);
      doc.text('Reste: ' + this.formarPrice(p) + ' FCFA', 6, 49);
      doc.text('*** Mode(s) de paiement ***', 6, 55);
      //doc.text(e.payment_method, 6, 58);

      // recuperation des modes de paiements
      count = 0;
      for (let i = 0; i < y.length; i++) {
        const z = y[i].split(',');
        for (let j = 0; j < z.length; j++) {
          if(z[j].trim()!=="") {
            doc.text(z[j].trim(), 6, 58 + count);
            count += 3;
          }
        }
        count+=2
      }

      doc.save( 'bvs_collect_ticket_' + e.id + '_' + moment(new Date()).utcOffset(1).format('YYMMDDHHmmss') + '.pdf');
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
