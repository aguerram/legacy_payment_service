import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DB_CUSTOMER,
  DB_CUSTOMER_TEST,
  TEST_MODE_PREFIX,
} from './../shared/constants';
import { CURRENCIES } from './../shared/currencies';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ICharge, Transaction } from './transaction.interfaces';
import { PaginateModel, Types, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  DB_TRANSACTION,
  DB_TRANSACTION_REFUNDS,
  DB_TRANSACTION_EVENTS,
  DB_TRANSACTION_TEST,
  DB_TRANSACTION_EVENTS_TEST,
  DB_TRANSACTION_REFUNDS_TEST,
  DB_MERCHANT,
} from 'src/shared/constants';
import {
  PaymentSettingsDto,
  CreateRefundDto,
  RefundManyDto,
} from './transaction.dto';
import {
  ApiResponse,
  generateUIDWithPrefix,
  isTestModeUID,
  calculateFees,
  accurateMoney,
  getTenDaysBeforeToday,
} from 'src/shared/helpers';
import {
  TRANSACTION_STATUS,
  TRANSACTION_REFUND_STATUS,
  TRANSACTION_EVENT_TYPE,
} from 'src/shared/enums';
import { TransactionRefundsService } from './refunds.service';
import { PaginateDataTableResponse } from 'src/shared/dto/paginate_data_table_response.dto';
import {
  CreateTransactionDTO,
  UpdateTransactionOnChargeUpdateDTO,
} from 'src/private/private-links/private-links.dto';
import { lookup as IPCountry } from 'geoip-country';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { WebclientService } from 'src/webclient/webclient.service';
import { CustomersService } from 'src/customers/customers.service';
import { omit } from 'lodash';
import { nanoid } from 'nanoid';
import { EmailEventTypes } from 'src/mailing/events/event-types';
import {
  EmailCustomerTransactionEvent,
  EmailMerchantTransactionEvent,
} from 'src/mailing/events/email.events';
import { WebhooksService } from 'src/webhooks/webhooks.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionsDAO } from './transaction.dao';
import { SettingsDAO } from 'src/merchants/settings.dao';
import { ChargeEvent } from './events/charge.event';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { CreateFinalPaymentDTO } from 'src/unnamed/unnamed.dto';
@Injectable()
export class TransactionsService {
  private logger: Logger = new Logger(TransactionsService.name);
  constructor(
    @InjectModel(DB_TRANSACTION)
    private transactionModel: PaginateModel<Transaction>,
    @InjectModel(DB_MERCHANT)
    private merchantModel: Model<Merchant>,
    @InjectModel(DB_TRANSACTION_TEST)
    private transactionModelTest: PaginateModel<Transaction>,
    private readonly transactionRefundsService: TransactionRefundsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly webClient: WebclientService,
    private readonly customerService: CustomersService,
    private readonly webhookService: WebhooksService,
    private readonly transactionsDAO: TransactionsDAO,
    private readonly settingsDAO: SettingsDAO,
    private readonly developerDAO: DeveloperDAO,
  ) {}

  async getMerchantTransactions(settings: PaymentSettingsDto) {
    let {
      status,
      query,
      method,
      count: limit,
      offset: page,
      testMode,
      merchant,
      to,
      from,
    } = settings;

    const _status = status ? status.split(',') : null;
    const _methods = method ? method.split(',') : null;

    let search = {};

    function numberedQuery() {
      if (query.match(/[0-9\.]+/)) {
        return {
          amount: {
            $lte: Math.floor(Number(query)) + 1,
            $gte: Math.ceil(Number(query)) - 1,
          },
        };
      }
      return null;
    }

    if (query?.trim()?.length > 0) {
      search = {
        $or: [
          {
            description: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            linkUID: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            status: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            'lastCharge.methodDetails.funding': {
              $regex: query,
              $options: 'i',
            },
          },
          {
            orderId: {
              $regex: query,
              $options: 'i',
            },
          },
        ],
      };

      const extra = numberedQuery();

      if (extra) {
        (search['$or'] as [any]).push(extra);
      }
    }

    const transactions = await this.getTransactionModel(
      settings.testMode,
    ).paginate(
      {
        merchant_id: merchant,
        ...(_status
          ? { status: { $in: _status, $nin: [TRANSACTION_STATUS.OPEN] } }
          : { status: { $nin: [TRANSACTION_STATUS.OPEN] } }),
        ...(_methods
          ? { 'lastCharge.methodDetails.funding': { $in: _methods } }
          : {}),
        createdAt: {
          $gte: from,
          $lte: to,
        },
        ...search,
      },

      {
        select:
          'createdBy payoutId createdAt amount customer_id fees amount_net amountRefunded currency description lastCharge.orderId lastCharge.methodDetails.cardHolder lastCharge.method status uid lastCharge.methodDetails.cardBrand refunds countryCode',
        page,
        limit,
        sort: { updatedAt: 'desc' },
      },
    );

    // still need to seperate this (not working when many merchant exist)
    let statuses = (
      await this.getTansactionsCountsByStatus(
        merchant,
        testMode,
        _methods,
        from,
        to,
        query,
      )
    ).data;

    let payments_data = new PaginateDataTableResponse();
    payments_data.data = transactions.docs;
    payments_data.count = transactions.limit;
    payments_data.offset = transactions.offset;
    payments_data.totalCounts = transactions.total;
    payments_data.filters.statuses = statuses;
    return new ApiResponse(0, payments_data);
  }

  async getTransactionInfo(merchant_id: string, uid: string) {
    try {
      const isTest = isTestModeUID(uid);
      let data = await this.getTransactionModel(isTest)
        .findOne(
          {
            uid,
            merchant_id,
          },
          { metadata: 0, log: 0, isSmsSent: 0, charges: 0 },
        )
        .populate({
          path: 'refunds',
          model: !isTest ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
        })
        .populate({
          path: 'events',
          model: !isTest ? DB_TRANSACTION_EVENTS : DB_TRANSACTION_EVENTS_TEST,
          options: { sort: { eventDatetime: -1 } },
        })
        .populate({
          path: 'customer_id',
          model: !isTest ? DB_CUSTOMER : DB_CUSTOMER_TEST,
        })
        .exec();

      if (!data) throw new NotFoundException();
      let totalRefundsAmount = 0;
      totalRefundsAmount = data.refunds?.reduce((pre, next) => {
        if (next.status === TRANSACTION_REFUND_STATUS.FAILDED) return pre;
        return pre + next.amount;
      }, 0);

      const remainingAmount = accurateMoney(data.amount - totalRefundsAmount);

      return new ApiResponse(
        0,
        Object.assign(data.toObject(), {
          remainingRefund: remainingAmount,
        }),
      );
    } catch (error) {
      return new ApiResponse(2000, null, false);
    }
  }

  async getTansactionsCountsByStatus(
    merchant_id: string,
    testMode: boolean,
    methods,
    from,
    to,
    query,
  ) {
    let aggregatorOpts = [
      {
        $match: {
          status: { $ne: TRANSACTION_STATUS.OPEN },
          merchant_id: Types.ObjectId(merchant_id),
          ...(methods
            ? { 'lastCharge.methodDetails.funding': { $in: methods } }
            : {}),
          createdAt: {
            $gte: new Date(from),
            $lte: new Date(to),
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          hasResult: { $cond: [{ $gt: ['$count', 0] }, true, false] },
        },
      },
    ];

    const data = await this.getTransactionModel(testMode)
      .aggregate(aggregatorOpts)
      .exec();

    return new ApiResponse(0, data);
  }

  // request refund for a single transaction
  async requestRefund(
    merchant_id: any,
    uid: string,
    refundDto: CreateRefundDto,
    testMode: boolean,
  ) {
    try {
      let transaction = await this.getTransactionModel(testMode)
        .findOne({
          merchant_id,
          uid,
        })
        .populate({
          path: 'refunds',
          model: !testMode
            ? DB_TRANSACTION_REFUNDS
            : DB_TRANSACTION_REFUNDS_TEST,
        });

      if (!transaction) throw new NotFoundException();

      let totalRefundsAmount = 0;
      totalRefundsAmount = accurateMoney(
        transaction.refunds?.reduce((pre, next) => {
          return pre + next.amount;
        }, 0),
      );

      const remainingAmount = accurateMoney(
        transaction.amount - totalRefundsAmount,
      );

      // check refund amount with remaining amout
      // if (refundDto.amount > transaction.amountRemaining) {
      if (refundDto.amount > remainingAmount) {
        return new ApiResponse(2006, null, false);
      }
      const session = await this.getTransactionModel(
        isTestModeUID(uid),
      ).db.startSession();
      session.startTransaction();
      try {
        let refund = await this.transactionRefundsService.createRefund(
          refundDto,
          uid,
        );
        transaction.refunds.push(refund._id);

        transaction.amountRemaining = remainingAmount;

        transaction.save();
        return new ApiResponse(2001, refund);
      } catch (error) {
        await session.abortTransaction();
        return new ApiResponse(2002, null, false);
      } finally {
        session.endSession();
      }
    } catch (error) {
      return new ApiResponse(2000, null, false);
    }
  }

  // request refund many transaction for a single transaction
  async requestRefundMany(merchant_id: any, refundsDto: RefundManyDto) {
    try {
      const isTest = refundsDto.testMode;

      let transactions = await this.getTransactionModel(isTest)
        .find({
          _id: { $in: refundsDto.transactionsIds },
          merchant_id,
        })
        .populate({
          path: 'refunds',
          model: !isTest ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
        });
      const session = await this.getTransactionModel(
        refundsDto.testMode,
      ).db.startSession();
      session.startTransaction();
      try {
        if (transactions.length > 0) {
          let totalRefundedTransactions = 0;
          let refundDto = new CreateRefundDto();
          for (let transaction of transactions) {
            let totalRefundsAmount = 0;
            totalRefundsAmount = accurateMoney(
              transaction.refunds?.reduce((pre, next) => {
                return pre + next.amount;
              }, 0),
            );

            const remainingAmount = accurateMoney(
              transaction.amount - totalRefundsAmount,
            );

            if (transaction.amountRemaining > remainingAmount) continue;

            refundDto.amount = transaction.amountRemaining;
            refundDto.description = refundsDto.reason;
            let refund = await this.transactionRefundsService.createRefund(
              refundDto,
              transaction.uid,
            );
            refund.save();

            // transaction.amountRemaining =
            //   transaction.amountRemaining - refund.amount;
            transaction.refunds.push(refund._id);
            transaction.save();
            totalRefundedTransactions++;
          }

          return new ApiResponse(2003, {
            nbTransactionRefunded: totalRefundedTransactions,
          });
        } else {
          return new ApiResponse(2004, null, false);
        }
      } catch (error) {
        await session.abortTransaction();
        return new ApiResponse(2005, null, false);
      } finally {
        session.endSession();
      }
    } catch (error) {
      return new ApiResponse(2000, null, false);
    }
  }

  async findByUID(uid: string) {
    return this.getTransactionModel(isTestModeUID(uid)).findOne({ uid });
  }

  //! ########################### PRIVATE LINKS ######################################
  /**
   * Use this for only private calls from dibsy payment
   * @param transaction
   * @returns
   */
  async createPayment(transaction: CreateTransactionDTO) {
    this.logger.log(`[Merchant ${transaction.merchant_uid}] creating a payment based on the link`)

    // get merchant rate to calculate fees
    const merchant = await this.merchantModel.findOne(
      { uid: transaction?.merchant_uid },
      { settings: 1, accounts: 1 },
    );
    if (!merchant)
      throw new BadRequestException(
        'Invalid Merchant ID when trying to save the transaction',
      );

    const model = this.getTransactionModel(transaction?.testMode);

    const {
      email: transationCustomerEmail,
      name: transationCustomerName,
      phone: transationCustomerPhone,
    } = transaction.customer || { };

    // create or update customer
    let customer;
    try {
      const _customer = {
        merchantId: merchant?._id,
        email: transationCustomerEmail,
        phone: transationCustomerPhone,
        name: transationCustomerName,
        testMode: transaction?.testMode,
      };
      customer = await this.customerService.addOrUpdateCustomer(_customer);
    } catch (error) {
      this.logger.error(`[Merchant ${transaction.merchant_uid}] error while creating a customer for payment`)
      this.logger.error(`[Merchant ${transaction.merchant_uid}] full error ${error}`)
    }

    // generate uid
    const uid = await this.generateUID(transaction?.testMode);
    const paymentToken = await this.generatePaymenToken(transaction?.testMode);

    const _transaction = new model({
      uid,
      paymentToken,
      status: TRANSACTION_STATUS.OPEN,
      amount: transaction.amount,
      currency: transaction.currency,
      locale: transaction?.lang,
      metadata: transaction?.metadata,
      customer_id: customer?.id,
      log: transaction?.log,
      custom_fields: transaction.custom_fields,
      linkUID: transaction?.linkUID,
      merchant_id: merchant?._id,
      description: transaction?.description,
      redirectUrl: transaction?.redirectUrl,
      webhookUrl: transaction?.webhookUrl,
      method: transaction?.method,
      createdBy:transaction?.createdBy
    });

    // emit the init payment event
    const chargeEvent = new ChargeEvent();
    chargeEvent.transaction_uid = uid;
    chargeEvent.testMode = transaction?.testMode;
    chargeEvent.eventType = TRANSACTION_EVENT_TYPE.INIT_PAYMENT;
    chargeEvent.message = `Payment created`;
    this.eventEmitter.emit('charge', chargeEvent);

    return await _transaction.save();
  }

  async getPayment(transaction_uid: string) {
    return await this.getTransactionModel(
      isTestModeUID(transaction_uid),
    ).findOne({
      uid: transaction_uid,
    });
  }

  async getPaymentByPaymentToken(paymentToken: string, testMode: boolean) {
    const payment = await this.findTransactionByPaymentToken(
      paymentToken,
      testMode,
    );
    return payment;
  }

  async updatePaymentAfterChargeUpdate(
    transaction: UpdateTransactionOnChargeUpdateDTO,
    transaction_uid: string,
  ) {
    this.logger.log(
      `Updating payment ${transaction_uid} after charge finished`,
    );
    const testMode = transaction?.testMode;
    const _transaction = await this.getTransactionModel(testMode).findOne({
      uid: transaction_uid,
    });

    const merchant = await this.merchantModel
      .findOne(
        { _id: _transaction?.merchant_id },
        { settings: 1, accounts: 1, organization: 1, uid: 1 },
      )
      .populate('settings');

    // update the counrty
    let country = '';
    try {
      country = IPCountry(transaction.log?.cardHolderIp).country;
    } catch (ex) {
      this.logger.error(
        `Country IP was not found, setting to default QA (Qatar)`,
      );
      country = 'QA';
    }
    _transaction.countryCode = country;

    // update the status and last charge
    _transaction.status = transaction.status;
    _transaction.lastCharge = transaction.lastCharge;

    // update fees and amounts info
    const isSuccessTransaction =
      transaction.status !== TRANSACTION_STATUS.FAILED;
    let fees = 0;
    if (isSuccessTransaction) {
        const rate = await this.settingsDAO.getMerchantMethodFees(
          merchant,
          transaction.lastCharge?.method,
        );
        if (rate.fixed && rate.percentage) {
          fees = accurateMoney(calculateFees(_transaction.amount, rate));
        } else {
          fees = accurateMoney(Number(process.env.DEFAULT_MIN_RATE) || 2.5);
        }

        // check minumum fees
        if(rate?.minimumFees>fees){
          fees = rate?.minimumFees;
        }
    }

    _transaction.fees = fees;
    _transaction.amountRemaining = isSuccessTransaction
      ? accurateMoney(_transaction.amount)
      : 0;
    _transaction.amount_net = isSuccessTransaction
      ? accurateMoney(_transaction.amount - fees)
      : 0;

    // save dates
    if (transaction.status === TRANSACTION_STATUS.SUCCEEDED) {
      _transaction.paidAt = new Date(transaction.date);
    } else {
      _transaction.failedAt = new Date(transaction.date);
    }
    // send notifications email & sms
    const { email, fullName, phone } = merchant.accounts[0] || {};
    const { methodDetails } = transaction.lastCharge;
    const customer = await this.customerService.getCustomerByID(
      _transaction.customer_id,
      testMode,
    );

    // send an email to merchant
    if (
      transaction.status === TRANSACTION_STATUS.SUCCEEDED &&
      merchant.uid !== '21032130'
    ) {
      // emit success payment email event for the merchant
      const emailEvent = new EmailMerchantTransactionEvent();
      emailEvent.email = email;
      emailEvent.fullName = fullName;
      emailEvent.amount = _transaction.amount;
      emailEvent.currency = _transaction.currency;
      emailEvent.orderId = transaction.lastCharge.orderId;
      emailEvent.paidAt = _transaction.paidAt;
      emailEvent.testMode = transaction?.testMode;
      emailEvent.fullName = fullName;
      emailEvent.fees = fees;
      emailEvent.cardNumber = methodDetails.cardNumber;
      emailEvent.cardBrand = methodDetails.cardBrand;
      emailEvent.customerName = customer?.name;
      emailEvent.subject = `Payment of ${_transaction.amount} ${_transaction.currency} - ${_transaction.uid}`;
      this.eventEmitter.emit(EmailEventTypes.MERCHANT_TRANSACTION, emailEvent);

      // emit success payment email event for the customer
      const customerEmailEvent = new EmailCustomerTransactionEvent();
      customerEmailEvent.email = customer?.email;
      customerEmailEvent.fullName = customer?.name;
      customerEmailEvent.amount = _transaction.amount;
      customerEmailEvent.currency = _transaction.currency;
      customerEmailEvent.paidAt = _transaction.paidAt;
      customerEmailEvent.testMode = transaction?.testMode;
      customerEmailEvent.transaction_uid = _transaction.uid;
      customerEmailEvent.cardNumber = methodDetails.cardNumber;
      customerEmailEvent.cardBrand = methodDetails.cardBrand;
      customerEmailEvent.merchantEmail = email;
      customerEmailEvent.merchantLegalName = merchant?.organization?.legalName;
      customerEmailEvent.checkoutLogo =
        merchant?.settings?.checkout?.logo?.path;
      customerEmailEvent.subject = `Purchase Confirmation`;
      this.eventEmitter.emit(
        EmailEventTypes.CUSTOMER_TRANSACTION,
        customerEmailEvent,
      );
    }
    // send sms to merchant
    if (
      phone &&
      !transaction?.testMode &&
      transaction.status === TRANSACTION_STATUS.SUCCEEDED
    ) {
      const name = fullName || 'there';
      try {
        const res = await this.webClient.getSmsCall().get('', {
          params: {
            smsText: `Hi ${name},\nA payment from ${customer.name} was successful.\nAmount Paid: ${_transaction?.amount} ${_transaction?.currency}\nOrder  ID: ${_transaction.lastCharge.orderId}`,
            recipientPhone: phone,
          },
        });

        if (res?.data?.d?.IsSuccess) {
          _transaction.isSmsSent = true;
        } else {
          _transaction.isSmsSent = false;
        }
      } catch (error) {
        _transaction.isSmsSent = false;
      }
    }
    const savedTransaciton = await _transaction.save();

    try {
      const transactionData = await this.transactionsDAO.getTransactionByUID(
        merchant.id,
        savedTransaciton.uid,
        testMode,
      );
      await this.webhookService.paymentFinishedWebhook(
        transactionData,
        merchant.uid,
      );
    } catch (ex) {}
    return savedTransaciton;
  }

  async findTransactionByPaymentToken(paymentToken: string, testMode: boolean) {
    return await this.getTransactionModel(testMode).findOne({
      paymentToken,
    });
  }
  async findTransactionByChargeId(
    chargeId: string,
    testMode: boolean,
  ): Promise<Transaction> {
    return await this.getTransactionModel(testMode).findOne({
      charges: { $all: [chargeId] },
    });
  }

  getTransactionModel(testMode = true): PaginateModel<Transaction> {
    return !testMode ? this.transactionModel : this.transactionModelTest;
  }

  async generatePaymenToken(testMode: boolean) {
    let token = null;
    while (token == null) {
      let _token = String(testMode ? `${TEST_MODE_PREFIX}_` : '') + nanoid();
      let ord = await this.findTransactionByPaymentToken(_token, testMode);
      if (!ord) {
        token = _token;
      }
    }
    return token;
  }

  async getPublicPaymentByPaymentToken(paymentToken: string) {
    const testMode = isTestModeUID(paymentToken);
    const payment = await this.findTransactionByPaymentToken(
      paymentToken,
      testMode,
    );
    if (!payment) {
      throw new NotFoundException();
    }
    const merchant = await this.merchantModel
      .findById(payment?.merchant_id)
      .populate('settings');

    if (!merchant) {
      throw new NotFoundException();
    }
    const developer = await this.developerDAO.getDeveloperByMerchantUID(
      merchant.uid,
      testMode,
    );
    if (!merchant) {
      throw new NotFoundException();
    }
    const activeMethods = await this.settingsDAO.getMerchantActiveMethodsLive(
      null,
      merchant,
      testMode,
    );

    const responseData = {
      payment: {
        paymentToken: payment.paymentToken,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        redirectUrl: payment.redirectUrl,
      },
      checkout: {
        logo: merchant?.settings?.checkout?.logo?.path,
        buttonColor: merchant?.settings?.checkout?.buttonColor,
      },
      merchant: {
        title: merchant?.organization?.legalName,
      },
      methods: activeMethods || {},
      pk: developer.publicKey,
    };

    return new ApiResponse(0, responseData, true);
  }

  async generateUID(testMode = true) {
    let uid = null;
    while (uid == null) {
      let _uid = generateUIDWithPrefix('tr', testMode);
      let link = await this.findByUID(_uid);
      if (!link) {
        uid = _uid;
      }
    }
    return uid;
  }

  async createFinalPayment(
    transaction: CreateFinalPaymentDTO,
    testMode: boolean,
  ): Promise<Transaction> {
    try {
      const model = this.getTransactionModel(testMode);
      const _transaction = new model(transaction);
      return await _transaction.save();
    } catch (error) {
      return null;
    }
  }

  // cronjob to remove transactions with status open & more than 10days of non-use
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async removeUnusedTransactions() {
    try {
      await this.transactionModel.deleteMany({
        status: TRANSACTION_STATUS.OPEN,
        createdAt: { $lte: getTenDaysBeforeToday() },
      });
      await this.transactionModelTest.deleteMany({
        status: TRANSACTION_STATUS.OPEN,
        createdAt: { $lte: getTenDaysBeforeToday() },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
