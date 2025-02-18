export class EmailEvent{
    email:string;
    fullName:string;
    subject:String;
    url?:string;
    templateName?:string;
}

export class EmailMerchantTransactionEvent extends EmailEvent{
    amount:number;
    fees:number;
    customerName:string;
    testMode:boolean;
    paidAt:Date;
    currency:string;
    orderId:string;
    cardNumber:string;
    cardBrand:string;
} 

export class EmailCustomerTransactionEvent extends EmailEvent{
    amount:number;
    testMode:boolean;
    paidAt:Date;
    currency:string;
    transaction_uid:string;
    cardNumber:string;
    cardBrand:string;
    merchantEmail:string;
    merchantLegalName:string;
    checkoutLogo:string;
}