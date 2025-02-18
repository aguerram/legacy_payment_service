import { DeveloperIsLiveKey } from '../../../developer/developer.islive.decorator';
import { Controller, Get,Param, UseGuards, Query } from '@nestjs/common';
import { DeveloperGuard } from 'src/developer/developer.guard';
import { SettlementsService } from './settlement.service';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { QueryPaginationDto } from 'src/shared/dto/navigate_links_dto';

@UseGuards(DeveloperGuard)
@Controller('v1/settlements')
export class SettlementsController {
  constructor(
    private readonly settlementService: SettlementsService,
  ) {}

  @Get('/:id')
  async getSettlement(
    @Param('id') uid: string,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @GetMerchant() merchant: Merchant
  ) {
    return await this.settlementService.getSettlement(merchant?._id,uid, isLiveKey);
  }


  @Get('')
  async ListSettlements(
    @Query() query: QueryPaginationDto,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @GetMerchant() merchant: Merchant
  ) {
    return await this.settlementService.ListSettlements(query,merchant?._id,isLiveKey);
  }
}
