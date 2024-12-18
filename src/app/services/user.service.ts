import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../models/User';
import { AuthService } from './auth.service';
import { map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  collectionName = 'Users';
  loggedInUser?: firebase.default.User | null;

  constructor(private afs: AngularFirestore, private authService: AuthService) { }

  create(user: User) {
    return this.afs.collection<User>(this.collectionName).doc(user.id).set(user);
  }

  getLoggedInUserRole(): Observable<string> {
    return this.authService.isUserLoggedIn().pipe(
      switchMap(user => {
        if (!user) {
          return of('user');
        }
        const userId = user.uid;
        return this.afs.collection<User>(this.collectionName).doc(userId).valueChanges().pipe(
          map((userDoc: User | undefined) => userDoc?.role || 'user')
        );
      })
    );
  }

  getUserId(): Observable<string> {
    return this.authService.isUserLoggedIn().pipe(
      map(user => {
        if (!user) {
          throw new Error('No user logged in');
        }
        return user.uid;
      })
    );
  }
}
