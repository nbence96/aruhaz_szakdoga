import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { Product } from 'src/app/models/Product';
import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { UserService } from 'src/app/services/user.service';
import { CartService } from 'src/app/services/cart.service';
import { CartItem } from 'src/app/models/CartItem';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-info',
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
})
export class InfoPage implements OnInit {
  productId!: string;
  product!: Product;
  loggedInUserRole!: string | null;
  loggedInUser: firebase.default.User | null = null;
  selectedSize: { [productId: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private modalController: ModalController,
    private userService: UserService,
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.productId = params.get('id')!;
      this.fetchProductDetails();
    });
    this.authService.isUserLoggedIn().subscribe(user => {
      this.loggedInUser = user;
    }, error => {
      console.log(error);
    });
    this.userService.getLoggedInUserRole().subscribe(role => {
      this.loggedInUserRole = role;
    });
  }

  fetchProductDetails() {
    this.productService.getProductById(this.productId).subscribe((product: Product | undefined) => {
      if (product) {
        this.product = product;
      } else {
        console.error('Product not found');
      }
    });
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

  addToCart(product: Product) {
    if (!this.selectedSize) {
      console.error('No size selected');
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      size: product.size,
      quantity: 1,
      imageUrl: product.imageUrl,
      userId: this.loggedInUser ? this.loggedInUser.uid : ""
    };

    this.cartService.addToCart(cartItem).then(() => {
      console.log('Product added to cart');
    }).catch(error => {
      console.error('Error adding product to cart: ', error);
    });
  }

  onModifyClick(product: Product) {
    console.log('Modify product', product);
    this.router.navigateByUrl("products/edit/" + product.id);
  }

  onDeleteClick(product: Product) {
    console.log('Modify product', product);
    this.productService.deleteProduct(product.id, product.imageUrl);
    this.router.navigateByUrl('home');
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
}
