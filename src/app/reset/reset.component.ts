import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {ActivatedRoute, Route, Router} from '@angular/router';
declare var Metro;
@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit {
  password: string;
  id: string;
  user: {
    setting: any[];
    has_reset_password: boolean;
    password: string;
    body: {
      id: number;
    };
    id: number;
    put(): any;
  };
  confirmation_password: string;
  constructor(private api: ApiProvider, private router: Router, private route: ActivatedRoute) {
    console.log(router);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('i');
    console.log(this.id);
    // recuperation du user
    this.api.Users.get(this.id).subscribe(d => {
      this.user = d;
    });
  }

  validatePassword() {
    if (this.password === this.confirmation_password) {
      this.user.id = this.user.body.id;
      this.user.has_reset_password = true;
      this.user.password = this.confirmation_password;
      this.user.setting = [];
      this.user.put().subscribe(a => {
        console.log(a);
        Metro.notify.create('Mot de passe modifié.', 'Succes', {cls: 'bg-or', timeout: 3000});
        this.router.navigate(['/s/dashboard']);
      }, q => {
        Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      });
    } else {
      Metro.notify.create('Erreur : Les mots de passes ne sont pas identiques.', 'Echec', {cls: 'warning', timeout: 3000});
    }
  }
}
