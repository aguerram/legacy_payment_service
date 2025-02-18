import { LINKS_STATUS } from 'src/shared/enums';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  Min,
  MinLength,
  IsNumber,
  IsArray,
} from 'class-validator';
import { PaginateDataTableDTO } from 'src/shared/dto/paginate_data_table_request.dto';
import { Transaction } from 'src/transactions/transaction.interfaces';

export class CheckoutFormDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsArray()
  custom_fields: CustomField[];
}

export class CustomerDTO {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone: string;
}

export class CreateLinkDTO {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @Min(0)
  @Type(() => Number)
  amount: number;
  @IsString()
  currency: string;
  
  @IsBoolean()
  @Type(() => Boolean)
  reusable: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  notifyWithSms: boolean = false;

  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @IsOptional()
  @IsString()
  customerLocale: string = 'en-Us';

  // @IsBoolean()
  // @Type(() => Boolean)
  // testMode: boolean;

  @IsOptional()
  //@ValidateNested()
  @Type(() => CustomerDTO)
  customer!: CustomerDTO;

  @IsOptional()
  @IsArray()
  custom_fields: CustomField[];
}

export class CustomField {
  @IsString()
  name: string;
  @IsString()
  label: string;
  @IsString()
  value: string;
}
export class GetLinksDTO extends PartialType(PaginateDataTableDTO) {
  @IsOptional()
  @IsString()
  status: string = null;
}

export class LinkPreviewDto {
  methods:{ [key:string]:boolean};
  link: GuestLinkDto;
  checkoutLogo: string;
  checkoutButtonColor:string;
}

export class GuestLinkDto {
  uid: string;
  amount: number;
  currency: string;
  description: string;
  name: string;
  status: LINKS_STATUS;
  reusable: string;
  expiresAt: Date;
  customerLocale: string;
  testMode: boolean;
  redirectUrl: string;
  merchant: string;
  paid: boolean;
  customer: any;
  custom_fields: CustomField[];
  pkey:string
}

export class LinkInfoDto {
  uid: string;
  amount: number;
  currency: string;
  description: string;
  name: string;
  status: LINKS_STATUS;
  reusable: string;
  expiresAt: Date;
  createdAt:Date;
  customer?: any;
  custom_fields: CustomField[];
  canResendSms: boolean;
  testMode: boolean;
  transactions: Transaction[];
  total_payments:number;
}


export class GetLinkTransactions {
  @Type(() => Number)
  @IsNumber()
  position: number;
}