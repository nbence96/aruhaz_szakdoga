import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Product } from '../models/Product';
import { Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Timestamp } from "@angular/fire/firestore";
import { CartItem } from '../models/CartItem';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  collectionName = 'Products';

  constructor(private afs: AngularFirestore, private storage: AngularFireStorage) {}

  addProduct(product: Product){
    const id = this.afs.createId();
    product.id = id;
    product.createdAt = Timestamp.fromDate(new Date());
    product.updatedAt = Timestamp.fromDate(new Date());
    return this.afs.collection<Product>(this.collectionName).doc(product.id).set(product);
  }

  getAllProducts(): Observable<Product[]> {
    return this.afs.collection<Product>(this.collectionName).valueChanges();
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.afs.collection(this.collectionName).doc<Product>(id).valueChanges();
  }

  updateProduct(id: string, product: Product){
    return this.afs.doc(`${this.collectionName}/${id}`).update({
      ...product,
      updatedAt: new Date(),
    });
  }

  deleteProduct(id: string, imageUrl: string): Promise<void> {
    const imageRef = this.storage.refFromURL(imageUrl);
    return imageRef.delete().toPromise().then(() => {
      return this.afs.doc(`${this.collectionName}/${id}`).delete();
    })
  }

  updateProductStock(cartItems: CartItem[]): Promise<void> {
    console.log('Updating product stock for cart items:', cartItems);
    const updatePromises = cartItems.map(async (item) => {
      try {
        const productRef = this.afs.collection('Products').doc(item.productId);
        const productDoc = await productRef.get().toPromise();
        const productData = productDoc?.data() as Product;

        if (productData) {
          const currentStock = productData.stock[item.size] || 0;
          console.log(`Processing cart item: ${item.productId}, size: ${item.size}, current stock: ${currentStock}`);

          if (currentStock >= item.quantity) {
            const newStock = currentStock - item.quantity;
            await productRef.update({
              [`stock.${item.size}`]: newStock
            });
            console.log(`Updated stock for product ID: ${item.productId}, size: ${item.size} is ${newStock}`);
          } else {
            console.error(`Insufficient stock for product ID: ${item.productId}, size: ${item.size}`);
            throw new Error('Insufficient stock');
          }
        } else {
          console.error(`Product data not found for product ID: ${item.productId}`);
        }
      } catch (error) {
        console.error(`Error updating stock for product ID: ${item.productId}`, error);
        throw error;
      }
    });

    return Promise.all(updatePromises)
      .then(() => console.log('Successfully updated all product stocks'))
      .catch((error) => {
        console.error('Error updating product stocks', error);
        throw error;
      });
  }
}
