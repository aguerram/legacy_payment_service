import { RESPONSE_TYPE } from './../../../shared/constants';
import { RESSOURCES, DOCS_URLS } from 'src/shared/constants';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Min, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import {
  NaviagateLinksDto,
  WebLinkDto,
  ListNaviagateLinksDto,
} from 'src/shared/dto/navigate_links_dto';
import { LINKS_STATUS } from 'src/shared/enums';
import { getSameDayNextMonthDate } from 'src/shared/helpers';
import { Merchant } from 'src/merchants/merchant.interfaces';

export class CreatePaymentLinkDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsDate()
  @Type(() => Date)
  expiresAt: Date = getSameDayNextMonthDate();

  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  reusable: boolean = false;

  @ApiProperty()
  @IsString()
  @IsOptional()
  redirectUrl: string;

  @ApiProperty()
  @IsOptional()
  notifyWithSms: boolean = false;
}

export class CreatePaymentLinkRecord extends CreatePaymentLinkDto{
  merchant:Merchant;
  uid:string;
}


export class GetPaymentLinkDto {
  @ApiProperty()
  resource: string = RESSOURCES.PAYMENT_LINK;

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  mode: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  redirectUrl: string;

  @ApiProperty()
  status: LINKS_STATUS;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  reusable: boolean;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  //@ApiProperty()
  _links: PaymentLink_LinksDto;
}

export class PaymentLink_LinksDto extends NaviagateLinksDto {
  @ApiProperty()
  paymentLink: WebLinkDto;

  constructor(self: WebLinkDto, paymentLink: WebLinkDto, doc_url: string) {
    const documentation = new WebLinkDto(doc_url, RESPONSE_TYPE.HTML);

    super(self, documentation);
    this.paymentLink = paymentLink;
  }
}
