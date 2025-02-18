import { Document } from 'mongoose';
import {
  TRANSACTION_STATUS,
  TRANSACTION_METHODS,
  TRANSACTION_CARD_BRAND,
  TRANSACTION_REFUND_STATUS,
  TRANSACTION_CHARGE_STATUS,
  TRANSACTION_EVENT_TYPE,
  CHARGE_METHOD,
  PAYMENT_GATEWAYS,
} from 'src/shared/enums';

export interface Transaction extends Document {
  uid: string;
  status: TRANSACTION_STATUS;
  paidAt: Date;
  method:CHARGE_METHOD;
  failedAt: Date;
  isSmsSent: boolean;
  amount: number;
  amount_net: number;
  fees: number;
  amountRefunded: number;
  amountRemaining: number;
  currency: string;
  description: string;
  paymentToken: string;
  linkUID: string;
  metadata: {
    [key: string]: any;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  custom_fields: {
    [key: string]: any;
  };
  locale: string;
  redirectUrl: string;
  webhookUrl: string;
  referrer: string;
  countryCode: string;
  merchant_id: string;
  customer_id: string;
  settlement_id: string;
  lastCharge: ICharge;
  settlementAmount: number;
  log: TransactionLog;
  events: TransactionEvent[];
  refunds: TransactionRefund[];
  charges: ICharge[];
  sessionID: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;  
  createdBy: string;

}

export interface TransactionLog {
  cardHolderIp: string;
  timeSpent: number;
}

export interface TransactionEvent extends Document {
  uid: string;
  type: TRANSACTION_EVENT_TYPE;
  message: string;
  eventDatetime: Date;
  gatewayResponse: string;
}

export interface TransactionRefund extends Document {
  uid: string;
  status: TRANSACTION_REFUND_STATUS;
  paidAt: Date;
  amount: number;
  currency: string;
  description: string;
  refundedAt: Date;
  failedAt: Date;
  createdAt: Date;
  gatewayResponse: string;
}

export interface ICharge extends Document {
  uid: string;
  status: TRANSACTION_CHARGE_STATUS;
  amount: number;
  currency: string;
  attempt: number;
  cardHolderIp: string;
  userAgent: string;
  timeSpent: string;
  orderId: string;
  method: CHARGE_METHOD;
  methodDetails?: MethodsDetails;
  failure?: Failure;
  gatewayResponse?: any;
}

export interface IGatewayResponse extends Document {
  gateway: PAYMENT_GATEWAYS;
  details: string;
}

export interface MethodsDetails {
  cardNumber: string;
  cardHolder: string;
  cardBrand: TRANSACTION_CARD_BRAND;
  cardCountryCode: string;
  cardIssuer: string;
  method?: CHARGE_METHOD;
}

export interface Failure {
  code: string;
  message: string;
}
