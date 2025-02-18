import { IsEnum, IsNotEmpty, IsString, IsDate, IsNumber } from "class-validator";
import { ONBOARDING_STATUS } from "src/shared/enums";

export class UpdateMerchantStatus {
    @IsNotEmpty()
    @IsEnum(ONBOARDING_STATUS)
    status: ONBOARDING_STATUS
}

export class refundEmailDTO {
    @IsNumber()
    refundAmount: number;
    @IsString()
    refundDate: string;
    @IsNumber()
    transactionAmount: number;
    @IsString()
    cardType: string;
    @IsString()
    currency: string;
    @IsString()
    transactionDate: string;
    @IsString()
    cardNumber: string;
}

export class settlementEmailDTO {
    @IsNumber()
    transactionTotal: number;
    @IsNumber()
    transactionFees: number;
    @IsNumber()
    refundsDeducted: number;
    @IsNumber()
    netTotal: number;
    @IsString()
    payoutDate: string;
    @IsString()
    settlementReference: string;
    @IsString()
    currency:string;
  }