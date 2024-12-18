import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OrderService } from 'src/app/services/order.service';
import { CartService } from 'src/app/services/cart.service';
import { ProductService } from 'src/app/services/product.service';
import { AuthService } from 'src/app/services/auth.service';
import { CartItem } from 'src/app/models/CartItem';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-success',
  templateUrl: './success.page.html',
  styleUrls: ['./success.page.scss'],
})
export class SuccessPage implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private http: HttpClient,
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService
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
          this.updateOrder(token);
        } else {
          console.error('Invalid token');
          this.router.navigate(['/home']);
        }
      }, error => {
        console.error('Error validating token:', error);
        this.router.navigate(['/home']);
      });
  }

  updateOrder(token: string) {
    this.orderService.updateOrderPaid(token).then(() => {
      console.log('Order updated successfully');
      this.authService.isUserLoggedIn().pipe(take(1)).subscribe(user => {
        if (user) {
          this.cartService.getCartItemsForUser(user.uid).pipe(take(1)).subscribe(cartItems => {
            console.log('Cart items:', cartItems);
            this.updateProductStockOnce(cartItems);
          });
        }
      });
    }).catch(error => {
      console.error('Error updating order:', error);
      this.router.navigate(['/home']);
    });
  }

  updateProductStockOnce(cartItems: CartItem[]) {
    if (cartItems.length > 0) {
      this.productService.updateProductStock(cartItems).then(() => {
        console.log('Product stock updated successfully');
        this.clearCart();
      }).catch(error => {
        console.error('Error updating product stock:', error);
      });
    } else {
      console.log('No cart items to update stock for.');
    }
  }

  clearCart() {
    this.authService.isUserLoggedIn().pipe(take(1)).subscribe(user => {
      if (user) {
        this.cartService.clearCart(user.uid).then(() => {
          console.log('Cart cleared successfully');
        }).catch(error => {
          console.error('Error clearing cart:', error);
        });
      } else {
        console.error('No user ID available');
      }
    });
  }
}
