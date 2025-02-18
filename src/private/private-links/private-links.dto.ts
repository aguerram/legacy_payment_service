import { IsNotEmpty } from 'class-validator';
import {  CustomerDTO, CustomField } from 'src/links/links.dto';
import {
  CHARGE_METHOD,
  TRANSACTION_REFUND_STATUS,
  TRANSACTION_STATUS,
} from 'src/shared/enums';
import { ICharge, Transaction } from 'src/transactions/transaction.interfaces';

export class CreateTransactionDTO {
  public amount: number;
  public currency: string;
  public customer: CustomerDTO;
  public redirectUrl: string;
  public webhookUrl: string;
  public createdBy: string;
  public linkUID: string;
  public lang: string;
  public log: any;
  public metadata: any;
  public description: string;
  public testMode: boolean;
  public merchant_uid: string;
  public method: CHARGE_METHOD;
  public custom_fields: CustomField[];
}

export type UpdateTransactionDTO = Transaction & {
  testMode: boolean;
  date: Date;
};

export class UpdateTransactionOnChargeUpdateDTO {
  testMode: boolean;
  lastCharge: ICharge;
  status: TRANSACTION_STATUS;
  log: any;
  date: Date;
}

export class SaveRefundDTO {
  @IsNotEmpty()
  public transactionUID: string;
  @IsNotEmpty()
  public refundUID: string;
  @IsNotEmpty()
  public refunded: number;
  @IsNotEmpty()
  public remainingAmount: number;
  @IsNotEmpty()
  public date: Date;
  @IsNotEmpty()
  public currency: string;
  @IsNotEmpty()
  public status: TRANSACTION_REFUND_STATUS;
  @IsNotEmpty()
  public metadata: any;
}
