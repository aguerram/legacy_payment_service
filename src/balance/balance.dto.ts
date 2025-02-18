import { CURRENCIES } from './../shared/currencies';
import { PaginateDataTableResponse } from 'src/shared/dto/paginate_data_table_response.dto';
import { PartialType } from "@nestjs/mapped-types"
import { PaginateDataTableDTO } 
from "src/shared/dto/paginate_data_table_request.dto";
import { IsString } from "class-validator";


export class BalanceSettingsDto extends PartialType(PaginateDataTableDTO){
    //@IsString()
    merchant: string;
  }



export class BalanceDataTableResponse extends PaginateDataTableResponse {
    currency: string=CURRENCIES.QAR;
    onHold: number;
    sentToBank: number;
    availableBalance: number;
  }