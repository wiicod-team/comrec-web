import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Router} from '@angular/router';
declare var Metro;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  users_count;
  customers_count;
  receipts_count;
  date_format = 'Y-M-D';
  deb;
  fin;
  best_seller;
  sum_receipt;
  sellers;
  load;
  today;
  from;
  now = new Date();
  to;
  public barChartLabels;
  public barChartType = 'bar';
  public barChartData = [
    {
      data: [],
      label: 'Montant recouvré',
      borderColor: '#000',
      hoverBackgroundColor: '#c29d3d',
      backgroundColor: '#888888',
    }
  ];

  constructor(private api: ApiProvider, private router: Router){

    const date = new Date();
    const j = date.getDay();
    let d = j % 7;
    let f = 6 - j % 7;
    if (d === 0) {
      d = 7;
      f = -1;
    }
    moment.locale('fr');

    this.init(new Date(), new Date());
  }

  ngOnInit() {
  }

  init(deb, fin) {
    this.load = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });

    this.deb = moment(deb);
    this.fin = moment(fin);
    this.getBestSeller();
    this.getReceipts();
    this.getCustomersCount();
    this.getUsersCount();
  }
  getUsersCount() {
    this.api.Users.getList({should_paginate: false}).subscribe(d => {
      this.users_count = d.length;
      Metro.activity.close(this.load);
    }, q => {
      Metro.activity.close(this.load);
      Metro.notify.create('getUsersCount ' + q.data.error.message, 'Erreur dashboard ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      if (q.data.error.status_code === 401) {
        // token expiré
        this.router.navigate(['/login']);
      }
    });
  }

  getCustomersCount() {
    this.api.Customers.getList({should_paginate: false}).subscribe(d => {
      this.customers_count = d.length;
    }, q => {
      // Metro.activity.close(this.load);
      Metro.notify.create('getCustomersCount ' + q.data.error.message, 'Erreur dashboard ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      if (q.data.error.status_code === 401) {
        // token expiré
        this.router.navigate(['/login']);
      }
    });
  }

  getReceipts() {
    const opt = {
      'created_at-get': this.deb.format(this.date_format),
      'created_at-let': this.fin.format(this.date_format),
      should_paginate: false
    };
    this.api.Receipts.getList(opt).subscribe(d => {
      this.sum_receipt = this.api.formarPrice( _.reduce(d, (memo, num) => {
        return memo + num.amount;
      }, 0));
      this.receipts_count = d.length;
      // somme du recouvrement du mois
    }, q => {
      // Metro.activity.close(this.load);
      Metro.notify.create('getReceipts ' + q.data.error.message, 'Erreur dashboard ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      if (q.data.error.status_code === 401) {
        // token expiré
        this.router.navigate(['/login']);
      }
    });
  }

  getBestSeller() {
    const opt = {
      'user_id-gb' : 'sum(amount) as total_amount',
      _sortDir: 'desc',
      _sort: ' total_amount',
      'created_at-get': this.deb.format(this.date_format),
      'created_at-let': this.fin.format(this.date_format),
      _includes: 'user',
      should_paginate: false
    };
    this.api.Receipts.getList(opt).subscribe(d => {
      this.sellers = d;
      if (d.length > 0) {
        this.best_seller = d[0].user.username;
        // creation des données du chart couple (vendeur, montant)
        const vente = [];
        const vendeur = [];
        d.forEach((v, k) => {
          vente.push(v.total_amount);
          vendeur.push(v.user.name);
        });
        this.barChartData[0].data = vente;
        this.barChartData[0].label = 'Montant recouvré';
        this.barChartLabels = vendeur;
        // Metro.activity.close(this.load);
      }
    }, q => {
      // Metro.activity.close(this.load);
      Metro.notify.create('getBestSeller ' + q.data.error.message, 'Erreur dashboard ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      if (q.data.error.status_code === 401) {
        // token expiré
        this.router.navigate(['/login']);
      }
    });
  }

  period() {
    Metro.dialog.open('#periodDialog');
  }

  validate() {
    this.from = (document.getElementById('from') as HTMLInputElement).value;
    this.to = (document.getElementById('to') as HTMLInputElement).value;
    this.today = 'du ' + this.from + ' au ' + this.to;
    this.init(this.from, this.to);
  }
}
