import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiProvider} from '../providers/api/api';
import {AuthProvider} from '../providers/auth/auth';

@Component({
  selector: 'app-sidemenu',
  templateUrl: './sidemenu.component.html',
  styleUrls: ['./sidemenu.component.scss']
})
export class SidemenuComponent implements OnInit {
  user;
  constructor(private router: Router, private api: ApiProvider, private auth: AuthProvider) {
    this.api.checkUser();
    this.user = JSON.parse(localStorage.getItem('user'));
  }

  ngOnInit() {
    this.auth.loadPermissions();
  }

  logout() {
    localStorage.setItem('user', null);
    this.router.navigate(['/login']);
  }
}
