import { CHARGE_METHOD } from './../../../shared/enums';
import { CURRENCIES } from './../../../shared/currencies';
import { TRANSACTION_STATUS } from 'src/shared/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  RESSOURCES,
  RESPONSE_TYPE,
} from 'src/shared/constants';
import {
  NaviagateLinksDto,
  WebLinkDto,
  ListNaviagateLinksDto,
} from 'src/shared/dto/navigate_links_dto';
import { getSameDayNextMonthDate } from 'src/shared/helpers';
import {
  IsString,
  IsOptional,
  Min,
  IsDate,
  Matches,
  IsObject,
  IsNumber,
} from 'class-validator';

import { Type } from 'class-transformer';
import { CustomerDTO } from 'src/links/links.dto';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { IFailure } from 'src/unnamed/unnamed.dto';

export class GetPaymentDto {
  @ApiProperty()
  resource: string = RESSOURCES.PAYMENT;

  @ApiProperty()
  id: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  mode: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  redirectUrl: string;

  @ApiProperty()
  webhookUrl: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: TRANSACTION_STATUS;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  settledAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  customer: CustomerDTO;

  @ApiProperty()
  paymentToken: string;

  @ApiProperty()
  method:string;

  @ApiProperty()
  metadata: any;
  
  @ApiProperty()
  details:IFailureDetails
  
  //@ApiProperty()
  _links: Payments_LinksDto;
}

export interface IFailureDetails{
  failureReason: string;
  failureMessage: string;
}

export class PaymentDataDto {
  payment: Transaction;
  customer_uid: string;
}

export class Payments_LinksDto extends NaviagateLinksDto {
  @ApiProperty()
  dashboard: WebLinkDto;

  @ApiProperty()
  checkout: WebLinkDto;

  @ApiProperty()
  customer: WebLinkDto;

  @ApiProperty()
  refunds: WebLinkDto;

  constructor(
    self: WebLinkDto,
    dashboard: WebLinkDto,
    customer: WebLinkDto,
    refunds: WebLinkDto,
    doc_url: string,
    checkout?: WebLinkDto,
  ) {
    const documentation = new WebLinkDto(doc_url, RESPONSE_TYPE.HTML);

    super(self, documentation);

    if (refunds) {
      this.refunds = refunds;
    }
    if (customer) {
      this.customer = customer;
    }
    if (checkout) {
      this.checkout = checkout;
    }
    this.dashboard = dashboard;
  }
}

export class GetListSettlements {
  @ApiProperty()
  count: number;

  @ApiProperty()
  _embedded: GetPaymentDto[];

  @ApiProperty()
  _links: ListNaviagateLinksDto;
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  metadata: any;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  customer: CustomerDTO;

  @ApiProperty()
  @IsString()
  @IsOptional()
  currency: string = CURRENCIES.QAR;

  @IsDate()
  @Type(() => Date)
  expiresAt: Date = getSameDayNextMonthDate();

  @ApiProperty()
  @IsOptional()
  redirectUrl: string = null;

  @ApiProperty()
  @IsOptional()
  identifier: string;

  @ApiProperty()
  @IsOptional()
  webhookUrl: string = null;

  @ApiProperty()
  @IsOptional()
  applePayPaymentToken

  @ApiProperty()
  @IsOptional()
  @Matches(
    `^${Object.values(CHARGE_METHOD)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
    {
      message: 'Please enter a valid method.',
    },
  )
  method:CHARGE_METHOD
}

export class CreatePaymentApplePayAPIDto {
  @IsString()
  @IsOptional()
  applePayPaymentToken: string;

  @IsString()
  paymentToken: string;

  @IsString()
  key: string;

  @IsString()
  @IsOptional()
  idenifier: string;
  
  @IsString()
  merchantUID:string;

}

export class CreatePaymentRecord extends CreatePaymentDto {
  merchant_id: string;
  orderId: string;
  uid: string;
  paymentToken: string;
  customer_id: string;
}

export class UpdatePaymentDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  locale: string;

  @ApiProperty()
  @Matches(
    /https?:\/\/(www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}|localhost)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
    { message: 'Please enter a valid redirectUrl.' },
  )
  @IsOptional()
  redirectUrl: string;

  @ApiProperty()
  @Matches(
    /https?:\/\/(www\.)?([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}|localhost)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
    { message: 'Please enter a valid webhook.' },
  )
  @IsOptional()
  webhookUrl: string;

  @ApiProperty()
  @IsOptional()
  metadata: any; // need to fix this just don't have time
}

export class MetaDataUpdate {
  @ApiProperty()
  @IsOptional()
  userAgent: any;

  @ApiProperty()
  @IsString()
  @IsOptional()
  referrer: string;
}
