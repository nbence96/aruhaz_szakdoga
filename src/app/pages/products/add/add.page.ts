import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
})
export class AddPage implements OnInit {
  productForm!: FormGroup;
  sizes: string[] = ['XS'];
  customSize: string = '';
  imageUrl: string = '';
  selectedImage: File | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, Validators.required],
      category: ['', Validators.required],
      color: ['', Validators.required],
      imageUrl: ['', Validators.required],
      stock: this.fb.group({
        XS: [0],
      }),
    });
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
    if (this.customSize && !(this.productForm.get('stock') as FormGroup).get(this.customSize)) {
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

  onSubmit() {
    if (this.productForm.valid) {
      const productData = this.productForm.value;
      this.productService.addProduct(productData).then(() => {
        this.router.navigate(['/home']);
      });
    }
  }
}
