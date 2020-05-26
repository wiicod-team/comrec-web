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
    this.api.Bills.getList({_agg: 'sum|amount', should_paginate: false, customer_id: id}).subscribe(d => {
      this.api.Receipts.getList({_agg: 'sum|amount', _includes: 'bill', 'bill-fk': 'customer_id=' + id, should_paginate: false}).subscribe(da => {
        this.dette = d[0].value - da[0].value;
        if (this.dette > 0) {
          this.customer.status = 'insolvent';
        }
      });
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
    console.log(opt);
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
