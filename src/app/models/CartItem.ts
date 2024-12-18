import { Timestamp } from "@angular/fire/firestore";

export interface CartItem {
    id?: string;
    productId: string;
    name: string;
    price: number;
    size: string;
    quantity: number;
    imageUrl: string;
    userId: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}