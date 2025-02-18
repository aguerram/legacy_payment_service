import { PaymentResponseService } from './payment.response.service';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DB_CHARGE, DB_CHARGE_TEST } from 'src/shared/constants';
import { Model } from 'mongoose';
import { ICharge } from './transaction.interfaces';
import { TransactionsService } from './transactions.service';
import { generateUIDWithPrefix, isTestModeUID } from 'src/shared/helpers';
import { CreateChargeDTO, UpdateChargeDTO } from './transaction.dto';
import {
  CHARGE_METHOD,
  TRANSACTION_CHARGE_STATUS,
  TRANSACTION_EVENT_TYPE,
  TRANSACTION_STATUS,
} from 'src/shared/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ChargeEvent } from './events/charge.event';
import { UpdateTransactionOnChargeUpdateDTO } from 'src/private/private-links/private-links.dto';
import { SettingsDAO } from 'src/merchants/settings.dao';
import { MerchantsService } from 'src/merchants/merchants.service';
import { CreateFinalChargeDTO } from 'src/unnamed/unnamed.dto';

@Injectable()
export class ChargesService {
  private logger: Logger = new Logger(ChargesService.name);
  constructor(
    @InjectModel(DB_CHARGE)
    private chargeModel: Model<ICharge>,
    @InjectModel(DB_CHARGE_TEST)
    private chargeModelTest: Model<ICharge>,
    private transactionsService: TransactionsService,
    private paymentResponseService: PaymentResponseService,
    private eventEmitter: EventEmitter2,
    private settingsDAO: SettingsDAO,
    private merchantService: MerchantsService,
  ) {}

  async initCharge(transaction_uid: string, data: CreateChargeDTO) {
    let { testMode, attempt } = data || {};
    const transaction = await this.transactionsService
      .getTransactionModel(testMode)
      .findOne({ uid: transaction_uid });
    if (transaction) {
      // check if transaction already processed
      if (
        transaction.status === TRANSACTION_STATUS.FAILED ||
        transaction.status === TRANSACTION_STATUS.OPEN
      ) {
        //check first if charge method is activated by merchant
        const merchant = await (
          await this.merchantService.getMerchantById(transaction.merchant_id)
        )
          .populate('settings')
          .execPopulate();

        const activeMethods =
          await this.settingsDAO.getMerchantActiveMethodsLive(
            null,
            merchant,
            testMode,
          );
        // check if the last charge is still pending

        if (!activeMethods[data.method])
          throw new BadRequestException({
            message: `This charge method is not activated by this merchant.${
              testMode
                ? ' For test mode, only credit card is enabled to test.'
                : ''
            }`,
          });

        //check if amex is active and credit card is disabled
        if (
          data.method === CHARGE_METHOD.AMEX &&
          !activeMethods[CHARGE_METHOD.CREDIT_CARD]
        ) {
          throw new BadRequestException({
            message: `This charge method is not activated by this merchant.${
              testMode
                ? ' For test mode, only credit card is enabled to test.'
                : ''
            }`,
          });
        }

        if (
          transaction?.lastCharge &&
          transaction?.lastCharge.status ===
            TRANSACTION_CHARGE_STATUS.PENDING &&
          transaction?.lastCharge?.method === data.method
        ) {
          return transaction?.lastCharge;
        }

        const orderId = await this.generateOrderID(testMode);
        const uid = await this.generateChargeUID(testMode);
        const model = this.getChargeModel(testMode);
        const countCharges = transaction.charges?.length || 0;
        this.logger.log(
          `Generating charge for transaction ${transaction.uid} attempt ${countCharges}`,
        );

        const charge = new model({
          uid,
          orderId,
          attempt: countCharges,
          method: data.method,
          amount: transaction.amount,
          currency: transaction.currency,
          cardHolderIP: data.cardHolderIp,
        });
        let _charge = await charge.save();

        // update charge on trsanction
        transaction.charges.push(_charge.id);
        await transaction.save();

        // emit the create charge event
        // const chargeEvent = new ChargeEvent();
        // chargeEvent.transaction_uid = transaction_uid;
        // chargeEvent.testMode = testMode;
        // chargeEvent.eventType = TRANSACTION_EVENT_TYPE.INIT_CHARGE;
        // chargeEvent.message = 'Charge initialized';
        // this.eventEmitter.emit('charge', chargeEvent);
        return _charge;
      } else {
        throw new BadRequestException(`The transaction is already completed.`);
      }
    } else {
      throw new NotFoundException(
        `Transaciton ${transaction_uid} doesn't exist`,
      );
    }
  }

  async updateCharge(
    transaction_uid: string,
    charge_uid: string,
    data: UpdateChargeDTO,
  ) {
    let {
      gatewayResponse: mpgsResponse,
      methodDetails,
      status,
      failure,
    } = data || {};
    const testMode = isTestModeUID(charge_uid);
    const charge = await this.getChargeModel(testMode).findOne({
      uid: charge_uid,
    });

    if (charge) {
      // save the mpgs first

      //check if this is a credit card payment and has mpgs
      if (!testMode) {
        //if it's test mode no need to save payment response
        const _mpgsResponse =
          await this.paymentResponseService.saveGatewayResponse(
            mpgsResponse,
            charge.method,
          );
        charge.gatewayResponse = _mpgsResponse?.id;
      }

      charge.status = status;
      charge.failure = failure;
      charge.methodDetails = methodDetails;

      // update the transaction
      const _transaction = new UpdateTransactionOnChargeUpdateDTO();
      _transaction.date = new Date();
      _transaction.lastCharge = charge;
      _transaction.testMode = testMode;
      _transaction.log = {
        cardHolderIp: data.cardHolderIP || charge.cardHolderIp,
        timeSpent: data.timeSpent,
      };
      _transaction.status = status as unknown as TRANSACTION_STATUS;
      await this.transactionsService.updatePaymentAfterChargeUpdate(
        _transaction,
        transaction_uid,
      );

      let tr_method = _transaction.lastCharge.method;

      let cardMethod = 'credit card';
      if (tr_method === CHARGE_METHOD.DEBIT_CARD) {
        cardMethod = 'debit card';
      } else if (tr_method === CHARGE_METHOD.APPEL_PAY) {
        cardMethod = 'apple pay';
      }
      let _paymentStatus = 'failed';
      if (_transaction.status == TRANSACTION_STATUS.SUCCEEDED) {
        _paymentStatus = 'paid';
      }
      // emit the update charge event
      const chargeEvent = new ChargeEvent();
      chargeEvent.transaction_uid = transaction_uid;
      chargeEvent.testMode = testMode;
      chargeEvent.eventType = TRANSACTION_EVENT_TYPE.CHARGE;
      chargeEvent.message = `Payment of type ${cardMethod} ${_paymentStatus}`;
      this.eventEmitter.emit('charge', chargeEvent);
      return await charge.save();
    } else {
      throw new BadRequestException('Invalid Charge ID');
    }
  }

  async getCharge(transaction_uid: string, charge_uid: string) {
    const testMode = isTestModeUID(charge_uid);
    const charge = await this.getChargeModel(testMode).findOne({
      uid: charge_uid,
    });
    const transaction = await this.transactionsService.findByUID(
      transaction_uid,
    );
    if (transaction && charge) {
      if (transaction.status === TRANSACTION_STATUS.SUCCEEDED) {
        throw new BadRequestException('The transaction is already completed');
      } else {
        return charge;
      }
    } else {
      throw new BadRequestException('Invalid Charge ID');
    }
  }

  async generateChargeUID(testMode) {
    let uid = null;
    while (uid == null) {
      let _uid = generateUIDWithPrefix('ch', testMode);
      let charge = await this.findChargeByUID(_uid);
      if (!charge) {
        uid = _uid;
      }
    }
    return uid;
  }

  async findChargeByUID(uid: string) {
    const testMode = isTestModeUID(uid);
    return await this.getChargeModel(testMode).findOne({ uid });
  }

  async findChargeByID(_id: string, testMode: boolean) {
    return await this.getChargeModel(testMode).findById({ _id });
  }
  getChargeModel(testMode = true): Model<ICharge> {
    return !testMode ? this.chargeModel : this.chargeModelTest;
  }

  async findChargeByOrderID(orderId: string, testMode: boolean) {
    return await this.getChargeModel(testMode).findOne({ orderId });
  }

  async findChargesByOrderID(orderId: string, testMode: boolean) {
    return await this.getChargeModel(testMode).find({ orderId });
  }

  async generateOrderID(testMode = true) {
    let orderId = null;
    while (orderId == null) {
      let _orderId = generateUIDWithPrefix('ord', testMode);
      let ord = await this.findChargeByOrderID(_orderId, testMode);
      if (!ord) {
        orderId = _orderId;
      }
    }
    return orderId;
  }

  // this service is only used for specific uses
  async createCompleteCharge(data: CreateFinalChargeDTO) {
    try {
      const charge = new this.chargeModel(data);
      return await charge.save();
    } catch (error) {
      return null;
    }
  }
}
