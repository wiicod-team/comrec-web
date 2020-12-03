import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {ActivatedRoute, Router} from '@angular/router';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import * as _ from 'lodash';
declare var Metro;
@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss']
})
export class CustomerDetailComponent implements OnInit {
  search = '';
  factures = [];
  display = 'none';
  user;
  state = false;
  dette = 0;
  page = 1;
  last_page = 10000000;
  facture: { id: number, avance?: number, amount?: number, name?: string, bvs_id?: number } = {id: 0};
  customer = {
    id: 0,
    bvs_id: 0,
    name: '',
    email: 'x@x.a',
    status: '',
    echue: 0,
    remain: 0,
    bills: 0,
    sale_network: ''
  };
  per_page = 25;
  constructor(private api: ApiProvider, private route: ActivatedRoute, private router: Router) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    const id = this.route.snapshot.paramMap.get('i');
    this.getCustomer(id);
    // this.getDebt(id);
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
      this.getBillStatus(id);
      this.getCustomerBillCount(id);
      this.getDebt(id);
      this.router.navigate(['/s/detail-client/' + id + '/facture/' + id]);
      Metro.activity.close(load);
    });
  }

  getDebt(id) {
    const opt = {
      _includes: 'receipts',
      should_paginate: false,
      'status-in': 'new,pending,remain',
      customer_id: id
    };
    this.api.Bills.getList(opt).subscribe( d => {
      d.forEach((v, k) => {
        let avance = 0;
        v.receipts = _.sortBy(v.receipts, 'received_at');
        v.receipts.forEach((vv, kk) => {
          avance += vv.amount;
        });
        v.avance = avance;
        if (v.receipts.length > 0) {
          const date_r = moment(v.receipts[0].received_at).add('hour', 2); // 1heure gmt et 1 heure pour le decalage entre les facture
          const date_n = moment(new Date());
          // si date de reception supérieure à la date d'encaissement d'une heure
          if (date_r > date_n) {
            // même jour
            v.reste = v.amount - v.receipts[0].amount;
          } else {
            v.reste = v.amount;
          }
        } else {
          v.reste = v.amount;
        }
        if (this.customer.bills === 0) {
          this.dette = 0;
        } else {
          this.dette += v.reste;
        }
      });
      if (this.dette > 0) {
        this.customer.status = 'insolvent';
      }
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getDebt ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('getDebt ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  getBillStatus(id) {
    let opt = {
      should_paginate: false,
      _agg: 'count',
      customer_id: id,
      status: 'pending',
      'creation_date-let': moment(new Date()).add('days', -30).format('YYYY-MM-DD HH:mm:ss')
    };
    this.api.Bills.getList(opt).subscribe(d => {
      this.customer.echue = d[0].value;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getEchues ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('getEchues ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });

    opt = {
      should_paginate: false,
      _agg: 'count',
      customer_id: id,
      status: 'remain',
      'creation_date-let': moment(new Date()).add('days', -30).format('YYYY-MM-DD HH:mm:ss')
    };
    this.api.Bills.getList(opt).subscribe(d => {
      this.customer.remain = d[0].value;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getEchues ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('getEchues ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

  getCustomerBillCount(id) {
    this.api.Bills.getList({should_paginate: false, _agg: 'count', customer_id: id, 'status-in': 'new,pending'}).subscribe(d => {
      this.customer.bills = d[0].value;
    }, q => {
      if (q.data.error.status_code === 500) {
        Metro.notify.create('getNonEchues ' + JSON.stringify(q.data.error.message), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      } else if (q.data.error.status_code === 401) {
        Metro.notify.create('Votre session a expiré, veuillez vous <a routerLink="/login">reconnecter</a>  ', 'Session Expirée ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 300});
      } else {
        Metro.notify.create('getNonEchues ' + JSON.stringify(q.data.error.errors), 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      }
    });
  }

}
