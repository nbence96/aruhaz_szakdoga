import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonAccordionGroup, ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Product } from 'src/app/models/Product';
import { AuthService } from 'src/app/services/auth.service';
import { ProductStoreService } from 'src/app/services/product-store.service';
import { ProductService } from 'src/app/services/product.service';
import { UserService } from 'src/app/services/user.service';
import { ConfirmationModalComponent } from '../shared/confirmation-modal/confirmation-modal.component';
import { CartService } from 'src/app/services/cart.service';
import { CartItem } from 'src/app/models/CartItem';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild('filtersAccordion') filtersAccordion!: IonAccordionGroup;

  loggedInUser?: firebase.default.User | null;
  loggedInUserRole?: string | null;

  products$?: Observable<Product[]>;
  filteredProducts: Product[] = [];
  searchCriteria = {
    name: '',
    category: '',
    priceRange: { lower: 0, upper: 10000 },
    size: [],
    color: '',
    type: ''
  };
  sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  selectedSize: { [productId: string]: string } = {};

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private productStoreService: ProductStoreService,
    private userService: UserService,
    private router: Router,
    private modalController: ModalController,
    private cartService: CartService
  ) { }

  ngOnInit() {
    this.authService.isUserLoggedIn().subscribe(user => {
      this.loggedInUser = user;
    }, error => {
      console.log(error);
    });
    this.userService.getLoggedInUserRole().subscribe(role => {
      this.loggedInUserRole = role;
    });
    this.products$ = this.productStoreService.products$;
    this.products$.subscribe(products => {
      this.filteredProducts = products;
    });
  }

  applyFilters() {
    const previousCriteria = { ...this.searchCriteria }; // Store previous criteria

    this.products$!.subscribe(products => {
      console.log('Applying filters:', this.searchCriteria);
      this.filteredProducts = products.filter(product => {
        const matchesName = !this.searchCriteria.name || product.name.toLowerCase().includes(this.searchCriteria.name.toLowerCase());
        const matchesCategory = !this.searchCriteria.category || product.category.toLowerCase().includes(this.searchCriteria.category.toLowerCase());
        const matchesPrice = product.price >= this.searchCriteria.priceRange.lower && product.price <= this.searchCriteria.priceRange.upper;
        const matchesSize = this.searchCriteria.size.length === 0 || this.searchCriteria.size.some(size => product.stock[size] > 0);
        const matchesColor = !this.searchCriteria.color || product.color.toLowerCase().includes(this.searchCriteria.color.toLowerCase());
        const matchesType = !this.searchCriteria.type || product.type === this.searchCriteria.type;

        return matchesName && matchesCategory && matchesPrice && matchesSize && matchesColor && matchesType;
      });
      console.log('Filtered products:', this.filteredProducts);

      // Check if any criteria other than type has changed
      const hasOtherCriteriaChanged = 
        previousCriteria.name !== this.searchCriteria.name ||
        previousCriteria.category !== this.searchCriteria.category ||
        previousCriteria.priceRange.lower !== this.searchCriteria.priceRange.lower ||
        previousCriteria.priceRange.upper !== this.searchCriteria.priceRange.upper ||
        previousCriteria.size.length !== this.searchCriteria.size.length ||
        previousCriteria.color !== this.searchCriteria.color;

      if (hasOtherCriteriaChanged) {
        this.toggleAccordion(); // Toggle accordion if other criteria have changed
      }
    });
  }

  toggleAccordion() {
    if (this.filtersAccordion) {
      const currentValue = this.filtersAccordion.value;
      this.filtersAccordion.value = currentValue === 'filters' ? undefined : 'filters';
    }
  }
  
  toProductDetails(id: string) {
    this.router.navigateByUrl("/products/" + id);
  }

  addToCart(product: Product) {
    if (!this.loggedInUser) {
      console.log('User not logged in');
      return;
    }

    const selectedSize = this.getAvailableSizes(product).find(size => product.stock[size] > 0);
    if (!selectedSize) {
      console.error('No size selected or available');
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      quantity: 1,
      imageUrl: product.imageUrl,
      userId: this.loggedInUser.uid
    };
    
    this.cartService.addToCart(cartItem).then(() => {
      console.log('Product added to cart');
    }).catch(error => {
      console.error('Error adding product to cart: ', error);
    });
  }

  onModifyClick(product: Product) {
    this.router.navigateByUrl("products/edit/" + product.id);
    console.log(product.id + " modify click");
  }

  onDeleteClick(product: Product) {
    console.log(product.id + " delete click");
    this.productService.deleteProduct(product.id, product.imageUrl);
  }

  async showConfirmationModal(product: Product, action: string) {
    const modal = await this.modalController.create({
      component: ConfirmationModalComponent,
      componentProps: {
        action: action,
        productName: product.name,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.confirmed) {
      switch (action) {
        case 'delete':
          this.onDeleteClick(product);
          break;
        case 'modify':
          this.onModifyClick(product);
          break;
        case 'buy':
          this.addToCart(product);
          break;
      }
    }
  }

  getAvailableSizes(product: Product): string[] {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL','3XL','4XL','5XL'];
    const availableSizes = Object.keys(product.stock);

    return availableSizes.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return 0;
    });
  }

  selectSize(product: any, size: string) {
    if (product.stock[size] > 0) {
      this.selectedSize[product.id] = size;
      product.size = size;
    }
  }
}
