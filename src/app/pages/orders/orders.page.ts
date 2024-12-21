import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { UserService } from 'src/app/services/user.service';
import { Order } from 'src/app/models/Order';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  userRole: string = '';

  constructor(private orderService: OrderService, private userService: UserService) {}

  ngOnInit() {
    this.userService.getLoggedInUserRole().subscribe(role => {
      this.userRole = role;
      this.loadOrders();
    });
  }

  loadOrders() {
    if (this.userRole === 'admin') {
      this.orderService.getAllOrders().subscribe(orders => {
        this.orders = orders
          .map(order => this.convertTimestamps(order))
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      });
    } else {
      this.userService.getUserId().subscribe(userId => {
        this.orderService.getOrdersByUserId(userId).subscribe(orders => {
          this.orders = orders
            .map(order => this.convertTimestamps(order))
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        });
      });
    }
  }

  private convertTimestamps(order: Order): Order {
    return {
      ...order,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  toggleOrderFulfilled(order: Order) {
    order.orderFulfilled = !order.orderFulfilled;
    this.orderService.updateOrder(order.id, { orderFulfilled: order.orderFulfilled }).then(() => {
      console.log(`Order ${order.id} fulfillment status updated to ${order.orderFulfilled}`);
    }).catch(error => {
      console.error('Error updating order:', error);
    });
  }
}
