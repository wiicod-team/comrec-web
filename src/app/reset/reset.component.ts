import { Component, OnInit } from '@angular/core';
import {ApiProvider} from '../providers/api/api';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CustomValidators} from '../custom-validators';
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
  confirmPassword: string;
  public frmSignup: FormGroup;

  constructor(private api: ApiProvider, private router: Router, private route: ActivatedRoute, private fb: FormBuilder) {
    this.frmSignup = this.createSignupForm();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('i');
    console.log(this.id);
    // recuperation du user
    this.api.Users.get(this.id).subscribe(d => {
      this.user = d;
    });
  }

  validatePassword(pwd) {
    this.user.id = this.user.body.id;
    this.user.has_reset_password = true;
    this.user.password = pwd;
    this.user.setting = [];
    this.user.put().subscribe(a => {
      console.log(a);
      Metro.notify.create('Mot de passe modifié.', 'Succes', {cls: 'bg-or', timeout: 3000});
      this.router.navigate(['/s/dashboard']);
    }, q => {
      Metro.notify.create(q.data.error.message, 'Erreur ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
    });
  }

  createSignupForm(): FormGroup {
    return this.fb.group(
      {
        /*email: [
          null,
          Validators.compose([Validators.email, Validators.required])
        ],*/
        password: [
          null,
          Validators.compose([
            Validators.required,
            // check whether the entered password has a number
            CustomValidators.patternValidator(/\d/, {
              hasNumber: true
            }),
            // check whether the entered password has upper case letter
            CustomValidators.patternValidator(/[A-Z]/, {
              hasCapitalCase: true
            }),
            // check whether the entered password has a lower case letter
            CustomValidators.patternValidator(/[a-z]/, {
              hasSmallCase: true
            }),
            // check whether the entered password has a special character
            CustomValidators.patternValidator(
              /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
              {
                hasSpecialCharacters: true
              }
            ),
            Validators.minLength(8)
          ])
        ],
        confirmPassword: [null, Validators.compose([Validators.required])]
      },
      {
        // check whether our password and confirm password match
        validator: CustomValidators.passwordMatchValidator
      }
    );
  }

  submit() {
    // do signup or something
    console.log(this.frmSignup.value);
    this.validatePassword(this.frmSignup.value.password);
  }
}
