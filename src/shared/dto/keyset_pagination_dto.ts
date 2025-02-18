import { ApiProperty } from "@nestjs/swagger";
import { ListNaviagateLinksDto } from "./navigate_links_dto";


export class ListDataResponse<T>{

    @ApiProperty()
    count:number;
  
    @ApiProperty()
    _embedded:T[];
  
    @ApiProperty()
    _links:ListNaviagateLinksDto;
  
  }