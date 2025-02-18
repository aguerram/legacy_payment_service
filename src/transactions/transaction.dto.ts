import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsNumber,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaginateDataTableDTO } from 'src/shared/dto/paginate_data_table_request.dto';
import { Transform, Type } from 'class-transformer';
import { accurateMoney, parseBooleanValidator } from 'src/shared/helpers';
import { CHARGE_METHOD, TRANSACTION_CHARGE_STATUS } from 'src/shared/enums';

export class PaymentSettingsDto extends PartialType(PaginateDataTableDTO) {
  @IsString()
  merchant: string;

  @IsOptional()
  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  status: string = null;
}

export class StatusDto {
  _id: string;
  count: number;
  hasResult: boolean;
}

export class CreateRefundDto {
  @Type(() => Number)
  @Transform((data) => {
    console.log('Transform from ', data.value, accurateMoney(data.value));
    return accurateMoney(data.value);
  })
  amount: number;

  @IsString()
  @IsOptional()
  description: string;

  @IsObject()
  @IsOptional()
  metadata: any;
}

export class CreateRefundRecord {}

export class RefundManyDto {
  transactionsIds: string[];

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsBoolean()
  testMode: boolean = true;
}

export class CreateChargeDTO {
  @IsNotEmpty()
  testMode: boolean;
  @IsNumber()
  attempt: number;

  @IsString()
  method: CHARGE_METHOD;

  cardHolderIp: string;
}

export class UpdateChargeDTO {
  gatewayResponse: any;
  methodDetails: any;
  cardHolderIP: string;
  userAgent: string;
  timeSpent: string;
  status: TRANSACTION_CHARGE_STATUS;
  failure: {
    code: string;
    message: string;
  };
}

export class SaveMPGSDTO {
  @IsNotEmpty()
  details: any;

  @IsNotEmpty()
  testMode: boolean;
}
