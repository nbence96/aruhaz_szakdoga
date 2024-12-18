import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from 'src/app/models/User';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  isToastOpen = false;
  toastMessage = "";

  form: FormGroup = new FormGroup({
    name: new FormControl('',Validators.required),
    email: new FormControl('',[Validators.required,Validators.email]),
    password: new FormControl('',[Validators.required,Validators.minLength(6)]),
    confirmPassword: new FormControl('',[Validators.required,Validators.minLength(6)])
  });
  
  constructor(private authService: AuthService,private router: Router,private userService: UserService) { }

  ngOnInit() {}

  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  signup(form:FormGroup){
    if(form.value['password'] == form.value['confirmPassword']){
      this.authService.signup(form.value['email'],form.value['password']).then(cred => {
        const user: User = {
          id: cred.user?.uid as string,
          email: form.value['email'],
          name: form.value['name'],
          role: "user"
        };
        this.userService.create(user).then(_ => {
          this.router.navigateByUrl('/home');
        }).catch(error => {
          console.log(error);
        });
      }).catch(error => {
        this.toastMessage = "Sikertelen regisztráció! Kérem ellenőrizze a megadott adatokat!";
        this.setOpen(true);
      });
    }else{
      this.toastMessage = "A megadott jelszavak nem egyeznek meg!";
      this.setOpen(true);
    }
  }
}
