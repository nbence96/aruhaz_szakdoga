import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    private router: Router,
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.isUserLoggedIn().pipe(take(1)).subscribe(user => {
      if (user) {
        this.cartService.getCartItemsForUser(user.uid).pipe(take(1)).subscribe(cartItems => {
          console.log('Cart items:', cartItems);
          this.updateProductStockOnce(cartItems);
        });
      } else {
        console.error('No user ID available');
        this.router.navigate(['/home']);
      }
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
