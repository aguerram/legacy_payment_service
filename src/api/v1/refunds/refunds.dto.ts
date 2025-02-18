import { ApiProperty } from '@nestjs/swagger';
import { TRANSACTION_REFUND_STATUS } from 'src/shared/enums';
import { RESSOURCES, RESPONSE_TYPE } from 'src/shared/constants';
import { NaviagateLinksDto, WebLinkDto, ListNaviagateLinksDto } from 'src/shared/dto/navigate_links_dto';


export class GetPaymentRefundDto {
  @ApiProperty()
  resource: string = RESSOURCES.PAYMENT;

  @ApiProperty()
  id: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  mode: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  paymentId: string;


  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: TRANSACTION_REFUND_STATUS;

  @ApiProperty()
  createdAt: Date;

  //@ApiProperty()
  _links: Refunds_LinksDto;
}


export class Refunds_LinksDto extends NaviagateLinksDto {
  
    @ApiProperty()
    payment: WebLinkDto;
  
    constructor(self: WebLinkDto, payment: WebLinkDto,doc_url:string) {
      const documentation = new WebLinkDto(
        doc_url,
        RESPONSE_TYPE.HTML,
      );
  
      super(self, documentation);
      this.payment = payment;
    }
  }
  

  export class GetListRefunds {
    @ApiProperty()
    count: number;
  
    @ApiProperty()
    _embedded: GetPaymentRefundDto[];
  
    @ApiProperty()
    _links: ListNaviagateLinksDto;
  }