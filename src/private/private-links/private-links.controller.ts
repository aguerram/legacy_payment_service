import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CHARGE_METHOD } from 'src/shared/enums';
import { TransactionRefundsService } from 'src/transactions/refunds.service';
import {
  CreateChargeDTO,
  UpdateChargeDTO,
} from 'src/transactions/transaction.dto';
import { PrivateAccessGuard } from '../guards/private-access.guard';
import {
  CreateTransactionDTO,
  SaveRefundDTO,
  UpdateTransactionDTO,
} from './private-links.dto';
import { PrivateLinksService } from './private-links.service';

@Controller('private')
@UseGuards(PrivateAccessGuard)
export class PrivateLinksController {
  constructor(
    private readonly privateLinksService: PrivateLinksService,
    private readonly refundService: TransactionRefundsService,
  ) {}
  @Get('/merchant/pkey/:pkey')
  async getMerchantByPublicKey(@Param('pkey') pkey: string) {
    return await this.privateLinksService.getMerchantUIDByPublicKey(pkey);
  }

  @Post('/payments')
  async createTransaction(@Body() body: CreateTransactionDTO) {
    return await this.privateLinksService.createTransaction(body);
  }

  @Get('/payments/payment-token/:paymentToken')
  async getPaymentByPaymentToken(
    @Param('paymentToken') paymentToken: string,
    @Query('testMode') testMode: boolean,
  ) {
    return await this.privateLinksService.getPaymentByPaymentToken(
      paymentToken,
      testMode,
    );
  }

  @Get('/payments/:uid')
  async getPayment(@Param('uid') transaction_uid: string) {
    return await this.privateLinksService.getPayment(transaction_uid);
  }

  @Get('/merchant/:uid/gateway/:method')
  async getMerchantGateway(
    @Param('uid') uid: string,
    @Param('method') method: CHARGE_METHOD,
  ) {
    return await this.privateLinksService.getMerchantGateway(uid, method);
  }

  @Get('/merchant/:uid')
  async getMerchant(@Param('uid') uid: string) {
    return await this.privateLinksService.getMerchant(uid);
  }

  @Get('/merchant/:uid/sub-merchant')
  async getMerchantSubMerchantInfo(@Param('uid') uid: string) {
    return await this.privateLinksService.getMerchantSubMerchantInfo(uid);
  }

  @Get('/transaction/byuid/:uid')
  async getTransactionByOrderUID(@Param('uid') uid: string) {
    return this.privateLinksService.findTransactionByUID(uid);
  }
  @Get('/refund/byuid/:uid')
  async getRefundByUID(@Param('uid') uid: string) {
    return this.privateLinksService.findRefundByUID(uid);
  }
  @Post('/transaction/:trUID/refund/:uid')
  async saveRefund(
    @Param('uid') uid: string,
    @Param('trUID') trUID: string,
    @Body() data: SaveRefundDTO,
  ) {
    return this.refundService.saveProcessedRefund(uid, trUID, data);
  }
  //charge endpoints

  @Get('/transactions/:trUID/charges/:chargeUID')
  async getCharge(
    @Param('trUID') trUID: string,
    @Param('chargeUID') chargeUID: string,
  ) {
    return this.privateLinksService.getTransactionCharge(trUID, chargeUID);
  }

  @Post('/transactions/:trUID/charges')
  async createTransactionCharge(
    @Param('trUID') trUID: string,
    @Body() body: CreateChargeDTO,
  ) {
    return this.privateLinksService.createTransacitonCharge(trUID, body);
  }

  @Put('/transactions/:trUID/charges/:chargeUID')
  async updateTransactionCharge(
    @Param('trUID') trUID: string,
    @Param('chargeUID') chargeUID: string,
    @Body() body: UpdateChargeDTO,
  ) {
    return this.privateLinksService.updateTransactonCharge(
      trUID,
      chargeUID,
      body,
    );
  }

  @Get('/merchants/methods/active/')
  async getMerchantActiveMethods(
    @Query('pk') pk:string
  ){
    return this.privateLinksService.getMerchantActiveMethods(pk)
  }


  // links endpoints
  @Get('/links/:uid')
  async getPyamentLinkByUID(
    @Param('uid') uid: string,
  ) {
    return this.privateLinksService.getLink(uid);
  }
}
