import { Component, OnInit } from '@angular/core';
import {AuthProvider} from '../providers/auth/auth';
import {ActivatedRoute, Router} from '@angular/router';

declare var Metro;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: string;
  password: string;

  constructor(private auth: AuthProvider, private route: ActivatedRoute, private router: Router) {
    this.username = '';
    this.password = '';
  }

  ngOnInit() {
  }

  loginUser() {
    if (this.username === '' && this.password === ''){
      //Metro.notify.create('Identifiant et mot de passe absents', 'Erreur de connexion', {cls: 'alert'});
    } else if (this.username === '' ) {
     // Metro.notify.create('Identifiant absent', 'Erreur de connexion', {cls: 'warning'});
    } else if ( this.password === '') {
      //Metro.notify.create('Mot de passe absent', 'Erreur de connexion', {cls: 'warning'});
    } else {
      this.auth.login({username: this.username, password: this.password}).then(rep => {
        console.log(rep);
        // redirection vers side-menu
        this.router.navigate(['/s/dashboard']);

      }).catch((err) => {
        if (err.data.error.status_code === 401) {
          Metro.notify.create('Email ou mot de passe incorrect', 'Echec de connexion', {cls: 'alert'});
        } else {
          Metro.notify.create('Erreur ' + err.data.error.status_code + ' : Service temporairement indisponible, Merci de réessayer dans quelques minutes.', 'Echec de connexion', {cls: 'alert'});
        }
      });
    }
  }

}
