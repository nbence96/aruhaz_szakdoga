import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductStoreService } from 'src/app/services/product-store.service';
import { Product } from 'src/app/models/Product';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  messages: string[] = [];
  userInput: string = '';
  products: Product[] = [];
  isLoading: boolean = false;

  constructor(private http: HttpClient, private productStoreService: ProductStoreService) { }

  ngOnInit() {
    this.productStoreService.products$.subscribe(products => {
      this.products = products;
    });
  }

  async sendChatPrompt(prompt: string): Promise<string> {
    try {
      const response = await this.http.post<{ response: string }>('https://us-central1-iruhabolt.cloudfunctions.net/geminiAiPrompt', { prompt }).toPromise();
      return response?.response || 'Error: Could not get a response from the server.';
    } catch (error) {
      console.error('Error sending chat prompt:', error);
      return 'Error: Could not get a response from the server.';
    }
  }

  async sendMessage() {
    if (this.userInput.trim()) {
      this.isLoading = true;
      const productDetails = this.products.map(product => 
        `Name: ${product.name}, Description: ${product.description}, Price: ${product.price}, Category: ${product.category}, Color: ${product.color}, Stock: ${JSON.stringify(product.stock)}, Created At: ${product.createdAt.toDate()}, Updated At: ${product.updatedAt.toDate()}`
      ).join('; ');

      const prompt = `Te egy intelligens webes asszisztens vagy, amely a weboldal felhasználóit segíti a termékekkel kapcsolatos információk megadásában, keresésben, valamint termékajánlásban. Célod, hogy gyors és pontos válaszokat adj a felhasználói kérdésekre, barátságos, professzionális, közvetlen és segítőkész hangnemben. Mindig állító mondatokkal válaszolj, és ne kérdezz vissza.

      ### **Feladatod:**
      1. **Válaszolj a következő típusú kérdésekre:**
         - **Termékinformációk:** név, leírás, ár, kategória, szín, létrehozás dátuma, módosítás dátuma.
         - **Fizetési módok:** kártyás fizetés (Stripe) vagy utánvét.
         - **Raktárkészlet:** csak közelítő információt adj meg, pl.: „Kevés van raktáron” vagy „Bőven van raktáron”.
         - **Termékajánlás:** a felhasználó keresése alapján ajánlj termékeket.

      2. **Bejelentkezési korlátozások kezelése:**
         - Ha a felhasználó rendelni vagy kosárba helyezni szeretne termékeket, közöld, hogy ehhez be kell jelentkezned. Példa: „A rendeléshez be kell jelentkezned.”

      3. **Speciális válaszok:**
         - **Termék nincs raktáron:** „Ez a termék nincs raktáron.”
         - **Ismeretlen kérdés esetén:** „Ezzel kapcsolatban keresd az ügyfélszolgálatot.”

      4. **Adatok:**
         - Az információkat előre betöltött adatokból nyered, amelyek tartalmazzák a következőket:  
           - Név, leírás, ár, kategória, kép URL, szín, létrehozás dátuma, módosítás dátuma.  
           - Raktárkészlet (stock): csak közelítő információ („Kevés van raktáron” vagy „Bőven van raktáron”).

      ### **Példaválaszok:**
      - **Kérdés:** „Adj információt a piros kabátról!”  
        **Válasz:** „A piros kabát 100% pamutból készült, az ára 15 000 Ft. Kevés van raktáron. A rendeléshez be kell jelentkezned.”

      - **Kérdés:** „Melyik terméket ajánlanád?”  
        **Válasz:** „A fekete bőrkabát népszerű választás, vagy választhatod a piros pamutkabátot a kényelem érdekében.”

      ### **Stílus:**
      - Barátságos, professzionális, közvetlen és segítőkész.  
      - **Mindig állító mondatokkal válaszolj. Ne kérdezz vissza.**

      A termékek adatai: ${productDetails}`;

      const fullMessage = `${prompt} ${this.userInput}`;

      this.messages.push(this.userInput);

      const aiResponse = await this.sendChatPrompt(fullMessage);
      this.messages.push(aiResponse);

      this.userInput = '';
      this.isLoading = false;
    }
  }
}
