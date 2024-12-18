import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
})
export class ConfirmationModalComponent {
  @Input() action!: string;
  @Input() productName!: string;

  constructor(private modalController: ModalController) {}

  get actionTitle(): string {
    switch (this.action) {
      case 'delete':
        return 'Termék törlése';
      case 'modify':
        return 'Termék módosítása';
      case 'buy':
        return 'Kosárhoz adás';
      default:
        return 'Erősítse meg a műveletet';
    }
  }

  get message(): string {
    switch (this.action) {
      case 'delete':
        return `Törli a(z) ${this.productName} terméket?`;
      case 'modify':
        return `Módosítja a(z) ${this.productName} terméket?`;
      case 'buy':
        return `Kosárhoz adja a(z) ${this.productName} terméket?`;
      default:
        return 'Biztosan végrehajtja a műveletet?';
    }
  }

  get detailedMessage(): string {
    switch (this.action) {
      case 'delete':
        return 'A művelet NEM visszafordítható.';
      case 'modify':
        return 'Bizonyosodjon meg, hogy minden adat helyes.';
      case 'buy':
        return 'A termék a kosarába kerül.';
      default:
        return '';
    }
  }

  get iconName(): string {
    switch (this.action) {
      case 'delete':
        return 'trash-bin-outline';
      case 'modify':
        return 'create-outline';
      case 'buy':
        return 'cart-outline';
      default:
        return 'help-outline';
    }
  }

  get iconColor(): string {
    switch (this.action) {
      case 'delete':
        return 'danger';
      case 'modify':
        return 'primary';
      case 'buy':
        return 'success';
      default:
        return 'medium';
    }
  }

  dismiss(confirmed: boolean) {
    this.modalController.dismiss({ confirmed });
  }
}
