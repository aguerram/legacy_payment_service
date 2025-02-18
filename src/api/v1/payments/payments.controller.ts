import { DeveloperIsLiveKey } from '../../../developer/developer.islive.decorator';
import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Body,
  Post,
  Put,
  BadRequestException,
} from '@nestjs/common';
import { DeveloperGuard } from 'src/developer/developer.guard';
import { PaymentsService } from './payments.service';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { QueryPaginationDto } from 'src/shared/dto/navigate_links_dto';
import { CreatePaymentDto, UpdatePaymentDto } from './payments.dto';
import { CHARGE_METHOD } from 'src/shared/enums';
import { GetDeveloperInfo } from 'src/developer/developer.decorator';
import { DeveloperI } from 'src/developer/model/developer.schema';
import { CURRENCIES } from 'src/shared/currencies';

@UseGuards(DeveloperGuard)
@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('/:id')
  async getPayment(
    @Param('id') uid: string,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @GetMerchant() merchant: Merchant,
  ) {
    return await this.paymentsService.getPayment(merchant?._id, uid, isLiveKey);
  }

  @Put('/:id')
  async updatePayment(
    @Param('id') uid: string,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @GetMerchant() merchant: Merchant,
    @Body() data: UpdatePaymentDto,
  ) {
    return await this.paymentsService.updatePayment(
      merchant?._id,
      uid,
      data,
      isLiveKey,
    );
  }

  // @Delete('/:id')
  // async cancelPayment(
  //   @Param('id') uid: string,
  //   @DeveloperIsLiveKey() isLiveKey: boolean,
  //   @GetMerchant() merchant: Merchant
  // ) {
  //   return await this.paymentsService.cancelPayment(merchant?._id,uid, isLiveKey);
  // }

  @Post('')
  async createPayment(
    @Body() data: CreatePaymentDto,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @GetDeveloperInfo() developer: DeveloperI,
    @GetMerchant() merchant: Merchant,
  ) {
    if (data?.method === CHARGE_METHOD.APPEL_PAY) {
      if(data?.currency!=CURRENCIES.QAR){
        throw new BadRequestException('The Dibsy API only supports QAR currency');
      }
      
      if (data?.applePayPaymentToken) {
        return await this.paymentsService.proccessApplePayPaymentAPI(
          data,
          isLiveKey,
          developer,
          merchant
        );
      }
      throw new BadRequestException('Apple payment token is missing.');
    }
    return await this.paymentsService.createPayment(merchant, data, isLiveKey);
  }

  @Get('')
  async listPayments(
    @Query() query: QueryPaginationDto,
    @DeveloperIsLiveKey() isLiveKey: boolean,
    @GetMerchant() merchant: Merchant,
  ) {
    return await this.paymentsService.ListPayments(
      query,
      merchant?._id,
      isLiveKey,
    );
  }
}
