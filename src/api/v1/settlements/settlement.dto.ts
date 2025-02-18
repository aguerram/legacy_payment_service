import { SETTLEMENT_STATUS } from './../../../shared/enums';
import { ApiProperty } from "@nestjs/swagger";
import { RESSOURCES, DOCS_URLS, RESPONSE_TYPE } from "src/shared/constants";
import { NaviagateLinksDto, WebLinkDto, ListNaviagateLinksDto } from "src/shared/dto/navigate_links_dto";


export class GetSettlementDto {
    @ApiProperty()
    resource: string = RESSOURCES.SETTLEMENT;
  
    @ApiProperty()
    id: string;
  
    @ApiProperty()
    reference: string;
  
    @ApiProperty()
    currency: string;

    @ApiProperty()
    amount: number;
  
    @ApiProperty()
    status: SETTLEMENT_STATUS;
  
    @ApiProperty()
    createdAt: Date;
  
    @ApiProperty()
    settledAt: Date;
  
    @ApiProperty()
    updatedAt: Date;
  
    //@ApiProperty()
    _links: Settlement_LinksDto;
  }
  
  
  export class Settlement_LinksDto extends NaviagateLinksDto {
    
    constructor(
      self: WebLinkDto,
    ) {
      
      const documentation = new WebLinkDto(
          DOCS_URLS.GET_SETTLEMENT,
          RESPONSE_TYPE.HTML,
        );
  
        super(self,documentation);
    }
  }

  
export class GetListSettlements{

  @ApiProperty()
  count:number;

  @ApiProperty()
  _embedded:GetSettlementDto[];

  @ApiProperty()
  _links:ListNaviagateLinksDto;

}
  