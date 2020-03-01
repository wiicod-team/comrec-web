import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private api: ApiProvider) {
    this.api.Users.getList().subscribe(d => {
      console.log(d);
    });
  }

  ngOnInit() {
  }

}
