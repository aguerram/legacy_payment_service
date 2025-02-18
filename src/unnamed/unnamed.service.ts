import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { Response } from 'express';
import _ from 'mongoose-paginate';
import { BincodeService } from 'src/bincode/bincode.service';
import { MerchantsService } from 'src/merchants/merchants.service';
import { SettingsDAO } from 'src/merchants/settings.dao';
import {
  CHARGE_METHOD,
  TRANSACTION_CHARGE_STATUS,
  TRANSACTION_EVENT_TYPE,
  TRANSACTION_STATUS,
} from 'src/shared/enums';
import {
  accurateMoney,
  calculateFees,
  formatCardNumber,
  getIPCountryCode,
  parseErrorFromMasterCardMetadata,
} from 'src/shared/helpers';
import { ChargesService } from 'src/transactions/charges.service';
import { ChargeEvent } from 'src/transactions/events/charge.event';
import { PaymentResponseService } from 'src/transactions/payment.response.service';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { TransactionsService } from 'src/transactions/transactions.service';
import { CreateFinalChargeDTO, CreateFinalPaymentDTO } from './unnamed.dto';

@Injectable()
export class UnnamedService {
  private logger: Logger = new Logger(UnnamedService.name);

  constructor(
    private readonly chargeServie: ChargesService,
    private readonly transactionsService: TransactionsService,
    private readonly paymentResponseService: PaymentResponseService,
    private readonly settingsDAO: SettingsDAO,
    private readonly merchantService: MerchantsService,
    private readonly bincodeService: BincodeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async processWebhookPayment(
    merchant: string,
    mpgs_response: any,
    testMode: boolean,
    res: Response,
  ) {
    this.logger.log(
      `processing new request from MC webhook - merchant ${merchant}`,
    );

    //const data = JSON.parse(mpgs_response);
    const data = mpgs_response;
    const card = data?.sourceOfFunds?.provided?.card;
    const isSuccessPayment =
      data?.result === 'SUCCESS' &&
      data?.sourceOfFunds?.provided?.fundingMethod != 'UNKNOWN';

    if (data?.transaction?.type !== 'PAYMENT')
      return res
        .status(200)
        .send({ error: "can't proccess this kind of payment" });

    try {
      // check if the payment has a success charge
      const ExistedCharges = await this.chargeServie.findChargesByOrderID(
        data.order.id,
        testMode,
      );

      const checkForSuccessCharge = ExistedCharges.filter(
        (charge) => charge.status == TRANSACTION_CHARGE_STATUS.SUCCEEDED,
      );
      if (checkForSuccessCharge?.length >= 1) {
        return res.status(200).send({ error: 'The payment already processed' });
      }

      //? create the charge what ever it's a new payment or already failed payment
      // get merchant by uid
      const _merchant = await this.merchantService.findMerchantByUID(merchant);
      if (!_merchant?._id) {
        this.logger.log(`Invalid merchant ID - merchant ${merchant}`);
        return res.status(400).send({ error: 'Invalid merchant ID' });
      }

      // save mpgs response
      const mpgs_saved = await this.paymentResponseService.saveGatewayResponse(
        data,
        CHARGE_METHOD.CREDIT_CARD,
      );
      if (!mpgs_saved?._id) {
        this.logger.log(`Erorr while saving MPGS response`);
        return res
          .status(400)
          .send({ error: 'Server was unable to save the payment' });
      }

      // create charge
      const _charge = new CreateFinalChargeDTO();
      _charge.gatewayResponse = mpgs_saved._id;
      _charge.amount = data?.order?.amount;
      _charge.orderId = data?.order?.id;
      _charge.uid = await this.chargeServie.generateChargeUID(testMode);
      const cardBin = String(card?.number)?.substr(0, 6);
      const cardInfo = await this.bincodeService.binLookup(cardBin);
      _charge.methodDetails = {
        cardCountryCode: cardInfo?.countrycode,
        cardBrand: card?.brand,
        funding: card?.fundingMethod || cardInfo?.type,
        cardNumber: formatCardNumber(card?.number),
        cardIssuer: cardInfo?.bank,
      };
      if (!isSuccessPayment) {
        _charge.failure = parseErrorFromMasterCardMetadata(data);
      }
      _charge.method = CHARGE_METHOD.CREDIT_CARD;
      _charge.status = isSuccessPayment
        ? TRANSACTION_CHARGE_STATUS.SUCCEEDED
        : TRANSACTION_CHARGE_STATUS.FAILED;
      const charge = await this.chargeServie.createCompleteCharge(_charge);
      if (!charge?._id) {
        this.logger.log(`Erorr while saving the charge`);
        return res
          .status(500)
          .send({ error: 'Server was unable to save the payment' });
      }

      let payment: Transaction;
      if (ExistedCharges.length >= 1) {
        //? create a new charge for an existed payment
        payment = await this.transactionsService.findTransactionByChargeId(
          ExistedCharges[0].id,
          testMode,
        );
        payment.lastCharge = charge;
        payment.status = isSuccessPayment
          ? TRANSACTION_STATUS.SUCCEEDED
          : TRANSACTION_STATUS.FAILED;
        payment.charges.push(charge._id);

        // update fees
        let fees = 0;
        const rate = await this.settingsDAO.getMerchantMethodFees(
          _merchant,
          payment.lastCharge?.method,
        );
        if (rate.fixed && rate.percentage && isSuccessPayment) {
          fees = accurateMoney(calculateFees(payment.amount, rate));
        } else if (isSuccessPayment) {
          fees = accurateMoney(
            calculateFees(payment.amount, {
              fixed: 1,
              percentage: 1.5,
            }),
          );
        }
        payment.fees = fees;
        payment.amountRemaining = isSuccessPayment
          ? accurateMoney(payment.amount)
          : 0;
        payment.amount_net = isSuccessPayment
          ? accurateMoney(payment.amount - fees)
          : 0;

        await payment.save();
      } else {
        //? create a totally new payment
        // create payement
        const _payment = new CreateFinalPaymentDTO();
        _payment.status = isSuccessPayment
          ? TRANSACTION_STATUS.SUCCEEDED
          : TRANSACTION_STATUS.FAILED;
        _payment.charges = [charge._id];
        _payment.lastCharge = charge;
        _payment.amount = data?.order?.amount;
        _payment.description = data?.order?.description;
        _payment.uid = await this.transactionsService.generateUID(testMode);
        _payment.countryCode = await getIPCountryCode(data?.device?.ipAddress);
        _payment.method = CHARGE_METHOD.CREDIT_CARD;
        _payment.paymentToken = await this.transactionsService.generatePaymenToken(
          testMode,
        );
        _payment.merchant_id = _merchant._id;

        let fees = 0;
        if (isSuccessPayment) {
          const rate = await this.settingsDAO.getMerchantMethodFees(
            _merchant,
            _payment.lastCharge?.method,
          );
          if (rate.fixed && rate.percentage) {
            fees = accurateMoney(calculateFees(_payment.amount, rate));
          } else {
            fees = accurateMoney(
              calculateFees(_payment.amount, {
                fixed: 1,
                percentage: 1.5,
              }),
            );
          }

          // check minumum fees
          if (rate?.minimumFees > fees) {
            fees = rate?.minimumFees;
          }
        }

        _payment.fees = fees;
        _payment.amountRemaining = isSuccessPayment
          ? accurateMoney(_payment.amount)
          : 0;
        _payment.amount_net = isSuccessPayment
          ? accurateMoney(_payment.amount - fees)
          : 0;

        // save dates
        if (isSuccessPayment) {
          _payment.paidAt = new Date();
        } else {
          _payment.failedAt = new Date();
        }

        payment = await this.transactionsService.createFinalPayment(
          _payment,
          testMode,
        );

        if (!payment?._id) {
          this.logger.log(`Erorr while saving the payment`);
          return res
            .status(500)
            .send({ error: 'Server was unable to save the payment' });
        }
      }

      // emit the payment finished event
      const chargeEvent = new ChargeEvent();
      chargeEvent.transaction_uid = payment.uid;
      chargeEvent.testMode = testMode;
      chargeEvent.eventType = TRANSACTION_EVENT_TYPE.CHARGE;
      if (isSuccessPayment) {
        chargeEvent.message = `Payment of type credit card paid`;
      } else {
        chargeEvent.message = `Payment of type credit card failed`;
      }
      this.eventEmitter.emit('charge', chargeEvent);

      return res.status(200).send();
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException)
        return res.status(500).send({ error: error?.message });
      else {
        return res
          .status(500)
          .send({ error: 'Server was unable to save the payment' });
      }
    }
  }
}
