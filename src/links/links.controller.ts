import { GetMerchant } from 'src/merchants/merchant.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { CheckoutFormDto, CreateLinkDTO, CustomerDTO, GetLinksDTO } from './links.dto';
import { LinksService } from './links.service';
import { API_PREFIX } from 'src/shared/constants';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { Logger } from '@nestjs/common';

@Controller(`${API_PREFIX}/links`)
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  async getLinks(
    @GetMerchant() merchant: Merchant,
    @Query() query: GetLinksDTO,
  ) {
    return await this.linksService.getLinks(merchant, query);
  }

  @Post('')
  @UseGuards(JwtAuthGuard)
  async createLink(
    @GetMerchant() merchant: Merchant,
    @Body() body: CreateLinkDTO,
  ) {
    return await this.linksService.createLink(merchant, body);
  }

  // mark the link as expired
  @Put('/:id/resend_sms')
  @UseGuards(JwtAuthGuard)
  async resendSmsMessage(
    @Param('id') linkUID: string,
    @GetMerchant() merchant: Merchant,
  ) {
    return await this.linksService.resendSmsMessage(linkUID, merchant);
  }

  // mark the link as expired
  @Put('/:id/mark_expired')
  @UseGuards(JwtAuthGuard)
  async makLinkAsExpired(@Param('id') linkUID: string) {
    return await this.linksService.markLinkAsExpired(linkUID);
  }

  // the link info for guest users [checkout preview page]
  @Get(':id/preview')
  async getLinkInforPreview(@Param('id') uid: string) {
    return await this.linksService.getLinkInforPreview(uid);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getLinkInfo(@Param('id') uid: string) {
    return await this.linksService.getLinkInfo(uid);
  }

  @Post(':id/payment')
  async createPaymentForLink(
    @Param('id') linkUID: string,
    @Body() checkoutForm:CheckoutFormDto
  ){
    Logger.log(`[Link ${linkUID}] creating a payment for the link`)
    return await this.linksService.createPaymentForLink(linkUID,checkoutForm);
  }

}
