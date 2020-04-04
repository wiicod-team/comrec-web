import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
declare var Metro;
@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements OnInit {
  username: string;
  constructor(private api: ApiProvider) { }

  ngOnInit(): void {
  }

  askReset() {
    this.api.Users.getList({username: this.username}).subscribe(d => {
      console.log(d);
      d[0].settings = [
        {
          ask_for_reset: true
        }
      ];
      d[0].has_reset_password = false;
      d[0].put().subscribe(data => {
        console.log(data);
        Metro.notify.create('Votre demande a été prise en compte. Vous recevrez un mail avec votre nouveau mot de passe.', 'Demande prise en charge ', {cls: 'bg-or fg-white', keepOpen: true, width: 300});
        this.username = '';
      }, q => {
        Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
      });
    }, q => {
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }
}
