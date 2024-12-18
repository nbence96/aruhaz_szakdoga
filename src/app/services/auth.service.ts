import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: AngularFireAuth, private router: Router) { }

  login(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  signup(email: string, password: string){
    return this.auth.createUserWithEmailAndPassword(email,password);
  }

  isUserLoggedIn(){
    return this.auth.user;
  }

  logout(){
    return this.auth.signOut();
  }
}
