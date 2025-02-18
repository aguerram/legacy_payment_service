import {
  Controller,
  UseGuards,
  Get,
  Param,
  UnauthorizedException,
  Query,
  Post,
  Body,
  Res,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { Merchant } from 'src/merchants/merchant.interfaces';
import {
  PaymentSettingsDto,
  CreateRefundDto,
  RefundManyDto,
} from './transaction.dto';
import { OwnerGuard } from 'src/auth/owner.guard';
import { CanActivateTestmodeGuard } from 'src/auth/can-activate-testmode.guard';
import { ExportService } from './export/export.service';
import { Response } from 'express';
import { API_PREFIX } from 'src/shared/constants';

@Controller(`${API_PREFIX}/transactions`)
export class TransactionsController {
  constructor(
    private readonly transactionService: TransactionsService,
    private readonly exportService: ExportService,
  ) {}

  // get transactions of a merchant with pagination
  @UseGuards(JwtAuthGuard, new OwnerGuard('merchant'), CanActivateTestmodeGuard)
  @Get('/')
  async getMerchantTransactions(@Query() settings: PaymentSettingsDto) {
    return await this.transactionService.getMerchantTransactions(settings);
  }

  @UseGuards(JwtAuthGuard, new OwnerGuard('merchant'), CanActivateTestmodeGuard)
  @Get('/export')
  async exportTransactionsToCSV(
    @Res() res: Response,
    @Query() dto: PaymentSettingsDto,
  ) {
    return await this.exportService.exportToCSV(res, dto);
  }

  // request refund for single transaction
  @UseGuards(JwtAuthGuard)
  @Post('/:uid/refund')
  async requestRefund(
    @GetMerchant() merchant: Merchant,
    @Param('uid') uid: string,
    @Body() refundDto: CreateRefundDto,
  ) {
    return await this.transactionService.requestRefund(
      merchant._id,
      uid,
      refundDto,
      merchant?.testMode,
    );
  }

  // request refund for many transactions
  @UseGuards(JwtAuthGuard, CanActivateTestmodeGuard)
  @Post('/refunds')
  async requestRefundsMany(
    @GetMerchant() merchant: Merchant,
    @Body() refundManyDto: RefundManyDto,
  ) {
    console.log(merchant);
    return await this.transactionService.requestRefundMany(
      merchant._id,
      refundManyDto,
    );
  }

  @Get('hosted/:paymentToken')
  async getPublicPaymentByPaymentToken(@Param('paymentToken') paymentToken: string) {
    return this.transactionService.getPublicPaymentByPaymentToken(paymentToken)
  }

  // get info of a single transaction
  @UseGuards(JwtAuthGuard, CanActivateTestmodeGuard)
  @Get('/:merchant_id/:uid')
  async getTransactionInfo(
    @Param('merchant_id') merchant_id: string,
    @Param('uid') uid: string,
    @GetMerchant() merchant: Merchant,
  ) {
    if (merchant._id == merchant_id) {
      return await this.transactionService.getTransactionInfo(merchant_id, uid);
    } else {
      return new UnauthorizedException();
    }
  }
}
