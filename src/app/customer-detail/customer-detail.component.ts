import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {ActivatedRoute, Router} from '@angular/router';
import * as jsPDF from 'jspdf';
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
    bills: 0,
    sale_network: ''
  };
  per_page = 25;
  constructor(private api: ApiProvider, private route: ActivatedRoute, private router: Router) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    const id = this.route.snapshot.paramMap.get('i');
    this.getCustomer(id);
    //this.getDebt(id);
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
      this.getEchues(id);
      this.getCustomerBillCount(id);
      this.getDebt(id);
      this.router.navigate(['/s/detail-client/' + id + '/facture/' + id]);
      Metro.activity.close(load);
    });
  }

  getDebt(id) {
    const opt = {
      //_includes: 'receipts',
      should_paginate: false,
      'status-not_in': 'paid',
      customer_id: id
    };
    this.api.Bills.getList(opt).subscribe( d => {
      let de = 0;
      d.forEach(v => {
        de += v.amount;
      });
      let sum_r = 0;
      /*d.forEach(v => {
        v.receipts.forEach(r => {
          sum_r += r.amount;
        });
      });*/
      this.dette = de - sum_r;
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

  getEchues(id) {
    const opt = {
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
