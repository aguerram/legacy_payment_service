import { CHARGE_METHOD } from './../shared/enums';
import { Type } from 'class-transformer';
import {
  IsString,
  MinLength,
  IsEmail,
  Matches,
  IsNumber,
  IsUrl,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
} from 'class-validator';


export class UserDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  fullName: string;
}

export class UpdatePasswdDto {
  @IsString()
  @MinLength(31, { message: 'The token is invalid' })
  token: string;

  @IsString()
  password: string;
}


export class RepresentativeDto {
  @IsString()
  fullName: string;

  @IsString()
  nationalityCode: string;

  @Matches(/(2|3)\d{10}/, { message: 'The QID number is invalid' })
  qidNumber: string;

  @IsBoolean()
  isUbo: boolean;
}

export class OrganizationDto {
  @IsBoolean()
  agree: boolean;

  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  representative: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string = "QA";

  @IsOptional()
  @IsString()
  commercialRegistrationNumber: number;
}

export class UpdateCompanyDto {
  @ValidateNested({ each: true })
  @Type(() => RepresentativeDto)
  representative: RepresentativeDto;

  @ValidateNested({ each: true })
  @Type(() => OrganizationDto)
  organization: OrganizationDto;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsUrl()
  url: string;

  // @IsEmail()
  email: string;

  // @IsPhoneNumber()
  phone: string;

  @IsNumber()
  categoryCode: number;

  @IsString()
  offeredProductsAndServices: string;

  // @IsString()
  targetCustomer: string;

  @IsString()
  paymentsVolume: string;
}

export class UpdatePayoutDto {
  @IsString()
  bankName: string;

  @IsString()
  accountName: String;

  @Matches(
    /QA[0-9]{2} ?[A-Za-z]{4} ?[\d]{4} ?[\d]{4} ?[\d]{4} ?[\d]{4} ?[\d]{4} ?[\d]{1}/,
    { message: 'Invalid IBAN format' },
  )
  IBAN: string;
}


export class BriefInfoDto {
  legalName: string;
  accountName: String;
  merchantId: string;
}


export class UpdatePaymentMethodDTO {
  method: CHARGE_METHOD;
  enabled: boolean;
}