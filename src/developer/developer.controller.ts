import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { MerchantsService } from 'src/merchants/merchants.service';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';
import { DeveloperResponse } from './dto/developer.response';
import { GetMerchantMapper, GetTransactionMapper } from './mapper/mappers';
import { DeveloperIsLiveKey } from './developer.islive.decorator';
import { API_PREFIX } from 'src/shared/constants';
@Controller(`${API_PREFIX}/rest`)
export class DeveloperController {

  constructor(
    private readonly merchantService: MerchantsService,
    private readonly developerService: DeveloperService,
  ) {}

  @Get()
  @UseGuards(DeveloperGuard)
  async getMerchantInformation(@GetMerchant() merchant: Merchant) {
    const data = await this.merchantService.findMerchantByUID(merchant.uid);
    //TODO return only public data
    return new DeveloperResponse(GetMerchantMapper.mapper(data));
  }

  @Get('transaction/:uid')
  @UseGuards(DeveloperGuard)
  async getTransaction(
    @Param('uid') uid: string,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
  ) {
    const transaction = await this.developerService.getTransaction(
      merchant,
      uid,
      isLiveKey,
    );
    return new DeveloperResponse(GetTransactionMapper.mapper(transaction));
  }
}
