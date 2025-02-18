import { IsArray, IsDate, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { CURRENCIES } from 'src/shared/currencies';
import {
  CHARGE_METHOD,
  TRANSACTION_CARD_BRAND,
  TRANSACTION_CHARGE_STATUS,
  TRANSACTION_METHODS,
  TRANSACTION_STATUS,
} from 'src/shared/enums';
import { ICharge } from 'src/transactions/transaction.interfaces';

export interface IMethodDetails {
  cardNumber: string;
  funding: TRANSACTION_METHODS;
  cardBrand: TRANSACTION_CARD_BRAND;
  cardIssuer:string;
  cardCountryCode: string,
}
export interface IFailure {
    code: string;
    message: string;
  }
export class CreateFinalChargeDTO {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency: string = CURRENCIES.QAR;

  @IsString()
  method: CHARGE_METHOD;

  @IsString()
  status: TRANSACTION_CHARGE_STATUS;

  @IsString()
  orderId: string;

  @IsString()
  uid: string;

  @IsObject()
  methodDetails:IMethodDetails;

  @IsObject()
  failure:IFailure;

  @IsString()
  gatewayResponse:string;
}

export class CreateFinalPaymentDTO {
  @IsNumber()
  amount: number;

  @IsNumber()
  amount_net: number;

  @IsNumber()
  fees: number;

  @IsNumber()
  amountRefunded: number;

  @IsNumber()
  amountRemaining: number;

  @IsString()
  @IsOptional()
  currency: string = CURRENCIES.QAR;

  @IsString()
  method: CHARGE_METHOD;

  @IsString()
  status: TRANSACTION_STATUS;

  @IsString()
  merchant_id: string;
  
  @IsString()
  countryCode: string;

  @IsString()
  description: string;

  @IsString()
  uid: string;

  @IsString()
  paymentToken: string;

  @IsObject()
  methodDetails:IMethodDetails;

  @IsObject()
  lastCharge:ICharge;

  @IsArray()
  charges:ICharge[];

  @IsArray()
  events:ICharge[];

  @IsDate()
  failedAt:Date;

  @IsDate()
  paidAt:Date;

}
