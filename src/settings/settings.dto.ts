import { RESET_TPYE } from './../shared/enums';
import { PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  MinLength,
  IsOptional,IsEnum
} from 'class-validator';
import { UpdatePayoutDto } from 'src/merchants/merchant.dto';

export class GeneralSettingsDTO {
  @IsString()
  fullName: string;
  @IsPhoneNumber()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'The password must be more than 8 charaters',
  })
  current_password: string;
  @IsString()
  @IsOptional()
  @MinLength(8, {
    message: 'The password must be more than 8 charaters',
  })
  new_password: string;
}


export class PayoutSettingsDTO extends PartialType(UpdatePayoutDto) {
  @IsString({
    message: "Password is required"
  })
  current_password: string;
}


export class ResetKeysDto {
  @IsEnum(RESET_TPYE)
  reset_type: RESET_TPYE;
}