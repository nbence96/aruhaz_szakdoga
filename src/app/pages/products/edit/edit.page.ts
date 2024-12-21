import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../../shared/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.page.html',
  styleUrls: ['./edit.page.scss'],
})
export class EditPage implements OnInit {
  productForm!: FormGroup;
  sizes: string[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  customSize: string = '';
  imageUrl: string = '';
  selectedImage: File | null = null;
  productId: string = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private storage: AngularFireStorage,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id') || '';

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, Validators.required],
      category: ['', Validators.required],
      type: ['', Validators.required],
      color: ['', Validators.required],
      imageUrl: ['', Validators.required],
      stock: this.fb.group({}),
    });

    this.sizes.forEach((size) => {
      (this.productForm.get('stock') as FormGroup).addControl(size, this.fb.control(0));
    });

    this.getProductDetails();
  }

  getProductDetails() {
    if (this.productId) {
      this.productService.getProductById(this.productId).subscribe((product) => {
        if (product) {
          this.productForm.patchValue(product);
          this.imageUrl = product.imageUrl;
          this.sizes = Object.keys(product.stock);
          this.sizes.forEach((size) => {
            (this.productForm.get('stock') as FormGroup).addControl(size, this.fb.control(product.stock[size]));
          });
        } else {
          console.error('Product not found');
        }
      }, (error) => {
        console.error('Error fetching product: ', error);
      });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      this.uploadImageToStorage(file);
    }
  }

  uploadImageToStorage(file: File) {
    const filePath = `products/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    task.percentageChanges().subscribe((percentage) => {
      console.log('Upload Progress: ', percentage);
    });

    task.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe((url) => {
          this.imageUrl = url;
          this.productForm.patchValue({ imageUrl: this.imageUrl });
        });
      })
    ).subscribe();
  }

  addCustomSize() {
    if (this.customSize && !this.sizes.includes(this.customSize)) {
      this.sizes.push(this.customSize);
      (this.productForm.get('stock') as FormGroup).addControl(this.customSize, this.fb.control(0));
      this.customSize = '';
    }
  }

  removeSize(index: number) {
    const sizeToRemove = this.sizes[index];
    this.sizes.splice(index, 1);
    (this.productForm.get('stock') as FormGroup).removeControl(sizeToRemove);
  }

  async onSubmit(action:string) {
    if (this.productForm.valid) {
      const modal = await this.modalCtrl.create({
        component: ConfirmationModalComponent,
        componentProps: {
          action: action,
          productName: this.productForm.get('name')!.value,
        },
      });

      modal.onDidDismiss().then((result) => {
        if (result.data.confirmed) {
          const productData = this.productForm.value;
          const filteredStock = this.sizes.reduce((acc, size) => {
            acc[size] = productData.stock[size];
            return acc;
          }, {} as { [key: string]: number });

          const updatedProductData = { ...productData, stock: filteredStock };

          this.productService.updateProduct(this.productId, updatedProductData).then(() => {
            this.router.navigate(['/home']);
          });
        }
      });

      return await modal.present();
    }
  }
}
