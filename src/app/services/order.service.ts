import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Order } from '../models/Order';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  collectionName = 'Orders';

  constructor(private afs: AngularFirestore) {}

  createOrder(order: Order): Promise<void> {
    const id = this.afs.createId();
    order.id = id;
    order.createdAt = Timestamp.fromDate(new Date());
    return this.afs.collection<Order>(this.collectionName).doc(order.id).set(order);
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return this.afs.collection(this.collectionName).doc<Order>(id).valueChanges();
  }

  getAllOrders(): Observable<Order[]> {
    return this.afs.collection<Order>(this.collectionName).valueChanges();
  }

  getOrdersByUserId(userId: string): Observable<Order[]> {
    return this.afs.collection<Order>(this.collectionName, ref => ref.where('customerId', '==', userId)).valueChanges();
  }

  updateOrderPaid(token: string): Promise<void> {
    return this.afs.collection(this.collectionName)
      .ref.where('token', '==', token)
      .where('isPaid', '==', false)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          return orderDoc.ref.update({
            isPaid: true,
            updatedAt: new Date()
          });
        }
        throw new Error('Order not found');
      });
  }

  deleteOrderPaidCancel(token: string): Promise<void> {
    return this.afs.collection(this.collectionName)
      .ref.where('token', '==', token)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          return orderDoc.ref.delete();
        }
        throw new Error('Order not found');
      });
  }

  updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
    return this.afs.collection<Order>(this.collectionName).doc(orderId).update({
      ...data,
      updatedAt: Timestamp.fromDate(new Date())
    });
  }
}
