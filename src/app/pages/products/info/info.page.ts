import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { Product } from 'src/app/models/Product';
import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-info',
  templateUrl: './info.page.html',
  styleUrls: ['./info.page.scss'],
})
export class InfoPage implements OnInit {
  productId!: string;
  product!: Product;
  loggedInUserRole!: string | null;
  loggedInUser: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private modalController: ModalController,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.productId = params.get('id')!;
      this.fetchProductDetails();
    });
    this.userService.getLoggedInUserRole().subscribe(role => {
      this.loggedInUserRole = role;
    })
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

  addToCart(product: Product) {
    console.log('Modify product', product);
  }

  onModifyClick(product: Product) {
    console.log('Modify product', product);
    this.router.navigateByUrl("products/edit/" + product.id);
  }

  onDeleteClick(product: Product) {
    console.log('Modify product', product);
    this.productService.deleteProduct(product.id,product.imageUrl);
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
