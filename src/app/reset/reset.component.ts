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
    settings: any[];
    has_reset_password: boolean;
    password: string;
    body: {
      id: number;
      status: string;
    };
    status: string,
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
    // recuperation du user
    this.api.Users.get(this.id).subscribe(d => {
      this.user = d;
    });
  }

  validatePassword(pwd) {
    this.user.id = this.user.body.id;
    this.user.status = this.user.body.status;
    this.user.has_reset_password = true;
    this.user.password = pwd;
    this.user.settings = [];
    this.user.put().subscribe(a => {
      this.router.navigate(['/s/dashboard']);
      Metro.notify.create('Mot de passe modifié.', 'Succès', {cls: 'bg-or', timeout: 3000});
    }, q => {
      Metro.notify.create('validatePassword ' + JSON.stringify(q.data.error.errors), 'Erreur reset ' + q.data.error.status_code, {cls: 'alert', keepOpen: true, width: 500});
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
    this.validatePassword(this.frmSignup.value.password);
  }
}
