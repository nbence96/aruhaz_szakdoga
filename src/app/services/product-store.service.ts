import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Product } from '../models/Product';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductStoreService {
  private products$$ = new BehaviorSubject<Product[]>([]);

  public products$: Observable<Product[]> = this.products$$.asObservable();

  constructor(private productService: ProductService) { 
    this.getAllProducts();
  }

  getAllProducts(): void{
    this.productService.getAllProducts().pipe(
      tap(products => {
        this.products$$.next(products)
      })
    ).subscribe();
  }
}
