import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem } from 'src/app/models/CartItem';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from 'src/app/services/order.service';
import { environment } from 'src/environments/environment';
import { Order } from 'src/app/models/Order';
import { getAuth } from '@angular/fire/auth';
import { loadStripe } from '@stripe/stripe-js';
import { Timestamp } from '@angular/fire/firestore';
@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
})
export class OrderPage implements OnInit {
  orderItems: CartItem[] = [];
  totalPrice: number = 0;
  orderForm: FormGroup;
  stripe: any;

  constructor(
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private orderService: OrderService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { orderItems: CartItem[], totalPrice: number };
    if (state) {
      this.orderItems = state.orderItems;
      this.totalPrice = state.totalPrice;
    }
    this.orderForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      paymentMethod: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.initStripe();
  }

  async initStripe() {
    this.stripe = await loadStripe(environment.stripePublicKey);
    if (!this.stripe) {
      console.error('Stripe.js not loaded');
    }
  }

  confirmOrder() {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    const order: Order = {
      id: '',
      customerId: currentUser.uid,
      items: this.orderItems,
      totalPrice: this.totalPrice,
      shippingInfo: this.orderForm.value,
      paymentMethod: this.orderForm.value.paymentMethod,
      stripeSessionId: '',
      isPaid: false,
      orderFulfilled: false,
      createdAt: Timestamp.fromDate(new Date()),
    };

    if (this.orderForm.value.paymentMethod === 'cash on delivery') {
      this.orderService.createOrder(order).then(() => {
        console.log('Order created successfully');
        this.router.navigate(['/order/success']);
      }).catch(error => {
        console.error('Error creating order:', error);
      });
    } else {
      this.http.post('http://localhost:3000/create-checkout-session', {
        items: this.orderItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      }).subscribe((session: any) => {
        order.stripeSessionId = session.id;
        order.token = session.token;
        this.orderService.createOrder(order).then(() => {
          this.stripe.redirectToCheckout({ sessionId: session.id }).then((result: any) => {
            if (result.error) {
              console.error('Stripe checkout error:', result.error.message);
            }
          });
        }).catch(error => {
          console.error('Error creating order:', error);
        });
      }, error => {
        console.error('Error creating checkout session:', error);
      });
    }
  }

  isFormValid(): boolean {
    const { name, address, phoneNumber, paymentMethod } = this.orderForm.value;
    return (
      name && address && phoneNumber &&
      (paymentMethod === 'credit card' || paymentMethod === 'cash on delivery')
    );
  }
}
