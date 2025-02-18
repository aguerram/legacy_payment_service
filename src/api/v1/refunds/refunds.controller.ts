import { RefundsService } from './refunds.service';
import { DeveloperIsLiveKey } from './../../../developer/developer.islive.decorator';
import {
  UseGuards,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { DeveloperGuard } from 'src/developer/developer.guard';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { CreateRefundDto } from 'src/transactions/transaction.dto';
import { QueryPaginationDto } from 'src/shared/dto/navigate_links_dto';

@UseGuards(DeveloperGuard)
@Controller('v1/payments')
export class RefundsController {
  constructor(
    private readonly refundsService: RefundsService,
  ) {}

  @Get('/:id/refunds')
  async listPaymentRefunds(
    @Param('id') uid: string,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @Query() query:QueryPaginationDto
  ) {    
      return await this.refundsService.listPaymentRefunds(uid,merchant?._id,query?.from,query?.limit,isLiveKey);
  }

  @Post('/:id/refunds')
  async createPaymentRefund(
    @Param('id') uid: string,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @Body() data: CreateRefundDto,
  ) {
    return await this.refundsService.createPaymentRefund(uid,data,merchant?._id,isLiveKey);
  }

  @Get('/:paymentId/refunds/:id')
  async getPaymentRefund(
    @Param('id') refund_uid: string,
    @Param('paymentId') paymentUid: string,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
  ) {
    return await this.refundsService.getPaymentRefund(refund_uid,paymentUid,merchant?._id,isLiveKey);
  }

  @Delete('/:paymentId/refunds/:id')
  async cancelPaymentRefund(
    @Param('id') refund_uid: string,
    @Param('paymentId') paymentUid: string,
    @GetMerchant() merchant: Merchant,
    @DeveloperIsLiveKey() isLiveKey: boolean,
  ) {
      return await this.refundsService.cancelPaymentRefund(refund_uid,paymentUid,merchant?._id,isLiveKey);
  }
}
