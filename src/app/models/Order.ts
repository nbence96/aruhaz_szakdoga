import { Timestamp } from '@angular/fire/firestore';
import { CartItem } from './CartItem';

export interface Order {
    id: string;
    customerId: string;
    items: CartItem[];
    totalPrice: number;
    shippingInfo: {
        name: string;
        address: string;
        phoneNumber: string;
    };
    paymentMethod: string;
    stripeSessionId?: string;
    isPaid: boolean;
    orderFulfilled: boolean;
    token?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}