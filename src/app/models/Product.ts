import { Timestamp } from "@angular/fire/firestore";

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    size: string;
    color: string;
    stock: {
        [key: string]: number;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}