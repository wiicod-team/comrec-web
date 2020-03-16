import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiProvider} from '../providers/api/api';

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss']
})
export class SidemenuComponent implements OnInit {
  user;
  constructor(private router: Router, private api: ApiProvider) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
    // console.log(this.user);
  }

  ngOnInit() {

  }

  logout() {
    localStorage.setItem('user', null);
    this.router.navigate(['/login']);
  }
}
