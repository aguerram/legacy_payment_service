import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CustomerDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  //@IsPhoneNumber()
  phone?: string;

  [key: string]: any;
}

export class CardDTO {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsNotEmpty()
  @Length(2)
  month: string;

  @IsNotEmpty()
  @Length(2)
  year: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(4)
  code: string;

  @IsString()
  @IsNotEmpty()
  holder: string;
}

export class TransactionDTO {
  @IsNumber()
  @Min(5)
  amount: number;
}