import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CartItem } from '../models/CartItem';
import { Timestamp } from "@angular/fire/firestore";
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Product } from '../models/Product';
import { QueryDocumentSnapshot, QuerySnapshot } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  collectionName = 'Cart';

  constructor(private afs: AngularFirestore) {}

  async addToCart(cartItem: CartItem) {
    const cartRef = this.afs.collection<CartItem>(this.collectionName).ref
      .where('productId', '==', cartItem.productId)
      .where('size', '==', cartItem.size)
      .where('userId', '==', cartItem.userId);
    const snapshot = await cartRef.get();

    const productRef = this.afs.collection('Products').doc(cartItem.productId);
    const productSnapshot = await firstValueFrom(productRef.get());
    const productData = productSnapshot.data() as Product;
    const availableStock = productData?.stock[cartItem.size];

    if (snapshot && !snapshot.empty) {
      const existingItem = snapshot.docs[0].data() as CartItem;
      const newQuantity = existingItem.quantity + cartItem.quantity;
      
      if (newQuantity <= availableStock) {
        await this.afs.collection<CartItem>(this.collectionName).doc(existingItem.id).update({ 
          quantity: newQuantity,
          updatedAt: Timestamp.fromDate(new Date())
        });
      } else {
        console.error('Cannot add to cart: Exceeds available stock');
      }
    } else {
      if (cartItem.quantity <= availableStock) {
        const id = this.afs.createId();
        cartItem.id = id;
        cartItem.createdAt = Timestamp.fromDate(new Date());
        await this.afs.collection<CartItem>(this.collectionName).doc(cartItem.id).set(cartItem);
      } else {
        console.error('Cannot add to cart: Exceeds available stock');
      }
    }
  }

  getCartItemsForUser(userId: string): Observable<CartItem[]> {
    return this.afs.collection<CartItem>(this.collectionName, ref => ref.where('userId', '==', userId))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as CartItem;
          const id = a.payload.doc.id;
          return { id, ...data };
        }))
      );
  }
  
  clearCart(userId: string): Promise<void> {
    return firstValueFrom(
      this.afs.collection<CartItem>(this.collectionName, ref => ref.where('userId', '==', userId))
        .get()
    ).then(querySnapshot => {
      querySnapshot.forEach((doc: QueryDocumentSnapshot<CartItem>) => doc.ref.delete());
    });
  }

  updateCartItemQuantity(itemId: string, quantity: number, userId: string): Promise<void> {
    return this.afs.collection<CartItem>(this.collectionName, ref => ref.where('userId', '==', userId))
      .doc(itemId).update({ quantity });
  }

  removeCartItem(itemId: string, userId: string): Promise<void> {
    return this.afs.collection<CartItem>(this.collectionName, ref => ref.where('userId', '==', userId))
      .doc(itemId).delete();
  }

  getProductStock(productId: string): Observable<Product | undefined> {
    return this.afs.collection<Product>('Products').doc(productId).valueChanges();
  }
}
