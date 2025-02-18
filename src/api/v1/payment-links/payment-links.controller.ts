import { DeveloperIsLiveKey } from '../../../developer/developer.islive.decorator';
import { CreatePaymentLinkDto } from './payment-links.dto';
import { Controller, Get, Post, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';
import { LinksService } from 'src/links/links.service';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { QueryPaginationDto } from 'src/shared/dto/navigate_links_dto';
import { DeveloperGuard } from 'src/developer/developer.guard';

@UseGuards(DeveloperGuard)
@Controller('v1/payment-links')
export class PaymentLinksController {
  constructor(
    private readonly paymentLinksService: PaymentLinksService,
    private readonly linksService: LinksService,
  ) {}

  @Get('/:id')
  async getPaymentLink(
    @Param('id') uid: string,
    @DeveloperIsLiveKey() isLiveKey: boolean,
  ) {
    return await this.paymentLinksService.getPaymentLink(uid, isLiveKey);
  }

  @Get('')
  async listPaymentLinks(
    @Query() data: QueryPaginationDto,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
  ) {
    return await this.paymentLinksService.getListPaymentLinks(data,merchant,isLiveKey);
  }

  @Post('')
  async createPaymentLink(
    @Body() data: CreatePaymentLinkDto,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
  ) {
    return await this.paymentLinksService.createPaymentLink(
      data,
      merchant,
      isLiveKey,
    );
  }
}
