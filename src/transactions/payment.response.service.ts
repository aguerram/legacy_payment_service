import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DB_GATEWAY_RESPONSE } from 'src/shared/constants';
import { Model } from 'mongoose';
import { IGatewayResponse } from './transaction.interfaces';
import { CHARGE_METHOD } from 'src/shared/enums';
import { chargeMethodToPaymentGateway } from 'src/shared/helpers';
@Injectable()
export class PaymentResponseService {
  constructor(
    @InjectModel(DB_GATEWAY_RESPONSE)
    private gatewayResponseModel: Model<IGatewayResponse>
  ) {}


  async saveGatewayResponse(details: any,method:CHARGE_METHOD) {
    const model = this.gatewayResponseModel
    const gatewayResponse = new model({
      details,
      gateway:chargeMethodToPaymentGateway(method)
    });

    return await gatewayResponse.save();
  }

  async getMPGSResponse(mpgsResponseId: string) {
    return await this.gatewayResponseModel.findById(mpgsResponseId);
  }

}
