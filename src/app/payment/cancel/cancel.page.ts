import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-cancel',
  templateUrl: './cancel.page.html',
  styleUrls: ['./cancel.page.scss'],
})
export class CancelPage implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      this.validateToken(token);
    });
  }

  validateToken(token: string) {
    this.http.post<{ valid: boolean }>('http://localhost:3000/validate-token', { token })
      .subscribe(response => {
        if (response.valid) {
          this.deleteOrder(token);
        } else {
          console.error('Invalid token');
          this.router.navigate(['/home']);
        }
      }, error => {
        console.error('Error validating token:', error);
        this.router.navigate(['/home']);
      });
  }

  deleteOrder(token: string) {
    this.orderService.deleteOrderPaidCancel(token).then(() => {
      console.log('Order deleted successfully');
    }).catch(error => {
      console.error('Error deleting order:', error);
      this.router.navigate(['/home']);
    });
  }
}
