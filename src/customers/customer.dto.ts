import { IsString, IsEmail, IsOptional, IsBoolean } from "class-validator"
import { PartialType } from '@nestjs/mapped-types';
import { PaginateDataTableDTO } from "src/shared/dto/paginate_data_table_request.dto";
import { Type } from 'class-transformer';


export class CreateCustomerDto{

    @IsBoolean()
    testMode:boolean=true;

    @IsString()
    name:string;

    @IsString()
    phone:string;

    @IsString()
    merchantId:string;

    @IsString()
    @IsEmail()
    email:string;
}

export class GetCustomersDto extends PartialType(PaginateDataTableDTO) {
    @IsOptional()
    // @IsBoolean()
    isBlacklist: boolean = false;
  }