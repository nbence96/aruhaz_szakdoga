import { Component, OnInit } from '@angular/core';
import { CartService } from 'src/app/services/cart.service';
import { AuthService } from 'src/app/services/auth.service';
import { CartItem } from 'src/app/models/CartItem';
import { Observable, firstValueFrom } from 'rxjs';
import { ProductService } from 'src/app/services/product.service';
import { Product } from 'src/app/models/Product';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {
  cartItems$?: Observable<CartItem[]>;
  totalPrice: number = 0;
  products: { [key: string]: Product } = {};
  userId: string | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.isUserLoggedIn().subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.cartItems$ = this.cartService.getCartItemsForUser(this.userId);
        this.cartItems$.subscribe(items => {
          this.totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          items.forEach(item => {
            if (item.quantity === 0) {
              this.removeFromCart(item);
            } else if (!this.products[item.productId]) {
              this.productService.getProductById(item.productId).subscribe(product => {
                if (product) {
                  this.products[item.productId] = product;
                  this.listenForStockChanges(item);
                } else {
                  console.warn(`Product with ID ${item.productId} not found.`);
                }
              });
            }
          });
        });
      }
    });
  }

  listenForStockChanges(item: CartItem) {
    this.cartService.getProductStock(item.productId).subscribe(product => {
      if (product && product.stock[item.size] < item.quantity) {
        const newQuantity = product.stock[item.size];
        this.cartService.updateCartItemQuantity(item.id!, newQuantity, this.userId!);
        console.log(`Updated quantity for ${item.name} to ${newQuantity} due to stock changes.`);
      } else if (!product) {
        console.warn(`Product with ID ${item.productId} not found.`);
      }
    });
  }

  increaseQuantity(item: CartItem) {
    const product = this.products[item.productId];
    if (product && product.stock[item.size] > item.quantity && this.userId) {
      const newQuantity = item.quantity + 1;
      this.cartService.updateCartItemQuantity(item.id!, newQuantity, this.userId);
    }
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1 && this.userId) {
      const newQuantity = item.quantity - 1;
      this.cartService.updateCartItemQuantity(item.id!, newQuantity, this.userId);
    }
  }

  getMaxQuantity(item: CartItem): number {
    const product = this.products[item.productId];
    return product ? product.stock[item.size] : 0;
  }

  removeFromCart(item: CartItem) {
    if (this.userId) {
      this.cartService.removeCartItem(item.id!, this.userId).then(() => {
        console.log('Item removed from cart');
      }).catch(error => {
        console.error('Error removing item from cart: ', error);
      });
    }
  }

  async onCheckout() {
    if (this.cartItems$) {
      const cartItems = await firstValueFrom(this.cartItems$);
      this.router.navigate(['/order'], {
        state: {
          orderItems: cartItems,
          totalPrice: this.totalPrice
        }
      });
    }
  }
}
