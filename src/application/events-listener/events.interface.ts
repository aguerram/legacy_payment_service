import { Merchant } from "src/merchants/merchant.interfaces";

export class MobileDocumentsUploadedEvent {
    merchant: Merchant;
    fromMobile: boolean;
    constructor(merchant: Merchant, fromMobile: boolean) {
        this.merchant = merchant;
        this.fromMobile = fromMobile;
    }
}