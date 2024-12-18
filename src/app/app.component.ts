import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  loggedInUser?: firebase.default.User | null;
  loggedInUserRole?: string | null;

  public appPages: { title: string; url?: string; icon: string; ngif: boolean; click: () => void; }[] = [];

  constructor(public router: Router, private authService: AuthService, private userService: UserService) {}

  ngOnInit() {
    this.authService.isUserLoggedIn().subscribe(user => {
      this.loggedInUser = user;
      if (user) {
        this.userService.getLoggedInUserRole().subscribe(role => {
          this.loggedInUserRole = role;
          this.initializeAppPages();
        });
      } else {
        this.initializeAppPages();
      }
    }, error => {
      console.log(error);
    });
  }
  
  initializeAppPages() {
    this.appPages = [
      { title: 'Főoldal', url: '/home', icon: 'home', ngif: true, click: () => {}},
      { title: 'Kosár', url: '/cart', icon: 'cart', ngif: !!this.loggedInUser, click: () => {}},
      { title: 'Termék hozzáadása', url: '/products/add', icon: 'add', ngif: this.loggedInUserRole === 'admin', click: () => {}},
      { title: 'Rendelések', url: '/orders', icon: 'receipt', ngif: !!this.loggedInUser, click: () => {}},
      { title: 'Chat', url: '/chat', icon: 'chatbubbles', ngif: true, click: () => {}},
      { title: 'Bejelentkezés', url: '/login', icon: 'log-in', ngif: !this.loggedInUser, click: () => {}},
      { title: 'Kijelentkezés', icon: 'log-in', ngif: !!this.loggedInUser, click: () => { this.logout(); }},
    ];
  }

  logout(){
    this.authService.logout();
    this.router.navigateByUrl('/home');
  }
}

