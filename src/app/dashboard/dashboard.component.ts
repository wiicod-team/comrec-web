import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import * as moment from 'moment';
import {ChartOptions} from 'chart.js';

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
  month;
  today;
  public barChartLabels;
  public barChartType = 'bar';
  public barChartData = [
    {data: [], label: 'Montant recouvré'}
  ];

  constructor(private api: ApiProvider) {
    const date = new Date();
    const j = date.getDay();
    let d = j % 7;
    let f = 6 - j % 7;
    if (d === 0) {
      d = 7;
      f = -1;
    }
    moment.locale('fr');
    this.deb = moment(new Date()).subtract(d - 1, 'days');
    this.fin = moment(new Date()).add(f + 1, 'days');
    this.init();
  }

  ngOnInit() {
  }

  init() {
    this.today = moment(new Date()).format('DD MMMM YYYY');
    this.month = moment(new Date()).format('MMMM YYYY');

    this.getBestSeller();
    this.getReceipts();
    this.getCustomersCount();
    this.getUsersCount();
  }
  getUsersCount() {
    this.api.Users.getList({should_paginate: false}).subscribe(d => {
      //console.log(d);
      this.users_count = d.length;
    });
  }

  getCustomersCount() {
    this.api.Customers.getList({should_paginate: false}).subscribe(d => {
      //console.log(d);
      this.customers_count = d.length;
    });
  }

  getReceipts() {
    const opt = {
      'created_at-get': this.deb.format(this.date_format),
      'created_at-let': this.fin.format(this.date_format),
      should_paginate: false
    };
    this.api.Receipts.getList(opt).subscribe(d => {
      console.log(d);
      this.sum_receipt = this.api.formarPrice( _.reduce(d, (memo, num) => {
        return memo + num.amount;
      }, 0));
      this.receipts_count = d.length;

      // somme du recouvrement du mois
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
    console.log(opt);
    this.api.Receipts.getList(opt).subscribe(d => {
      console.log(d);
      if (d.length > 0) {
        this.best_seller = d[0].user.username;
        // creation des données du chart couple (vendeur, montant)
        const vente = [];
        const vendeur = [];
        d.forEach((v, k) => {
          vente.push(v.total_amount);
          vendeur.push(v.user.username);
        });
        this.barChartData = [
          {data: vente, label: 'Montant recouvré'}
        ];
        this.barChartLabels = vendeur;
      }
    });
  }


}
