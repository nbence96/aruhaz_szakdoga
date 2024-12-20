import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage{
  isToastOpen = false;

  form: FormGroup = new FormGroup({
    email: new FormControl('',[Validators.email,Validators.required]),
    password: new FormControl('',[Validators.required,Validators.minLength(6)])
  });

  constructor(private router: Router, private authService: AuthService) { }

  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  login(form: FormGroup) {
    this.authService.login(form.value['email'],form.value['password']).then(cred => {
      this.router.navigateByUrl('home');
    }).catch(error => {
      this.setOpen(true);
      console.error(error);
    });
  }

  logout(){
    this.authService.logout();
  }
}