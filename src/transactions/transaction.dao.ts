import { PaymentDataDto } from './../api/v1/payments/payments.dto';
import { CustomersService } from './../customers/customers.service';
import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DB_TRANSACTION,
  DB_TRANSACTION_TEST,
  DB_TRANSACTION_REFUNDS,
  DB_TRANSACTION_REFUNDS_TEST,
} from 'src/shared/constants';
import { PaginateModel, Model, Types } from 'mongoose';
import { Transaction } from './transaction.interfaces';
import {
  CreatePaymentDto,
  CreatePaymentRecord,
} from 'src/api/v1/payments/payments.dto';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransactionsDAO {
  constructor(
    @InjectModel(DB_TRANSACTION)
    private transactionModel: PaginateModel<Transaction>,
    @InjectModel(DB_TRANSACTION_TEST)
    private transactionModelTest: PaginateModel<Transaction>,
    @Inject(forwardRef(() => TransactionsService))
    private  transactionService: TransactionsService,
    private readonly customersService: CustomersService,
  ) {}

  async getTransactionByUID(
    merchant_id: string,
    uid: string,
    testMode: boolean,
  ): Promise<PaymentDataDto> {
    const payment = await this.getTransactionModel(testMode).findOne({
      merchant_id,
      uid,
    });

    const data = new PaymentDataDto();
    data.payment = payment;

    if (payment?.customer_id) {
      const customer = await this.customersService.getCustomerByID(
        payment?.customer_id,
        testMode,
      );
      data.customer_uid = customer.uid;
    }

    return data;
  }

  async createPayment( 
    merchant_id: string,
    data: CreatePaymentDto,
    testMode: boolean,
  ) {
    try {
      const record = new CreatePaymentRecord();
      record.amount = data.amount;
      record.redirectUrl = data.redirectUrl;
      record.webhookUrl = data.webhookUrl;
      record.currency = data.currency;
      record.description = data.description;
      record.expiresAt = data.expiresAt;
      record.metadata = data?.metadata;
      record.merchant_id = merchant_id;
      record.uid = await this.transactionService.generateUID(testMode);
      record.paymentToken = await this.transactionService.generatePaymenToken(
        testMode,
      );
      record.method = data.method ?? null;
      let customer;
      try {
        const _customer = {
          merchantId: merchant_id,
          testMode,
          ...data.customer,
        };
        customer = await this.customersService.addOrUpdateCustomer(_customer);
        record.customer_id = customer._id;
      } catch (error) {
        console.log(error)
        console.log("Can't create or update customer");
      }
      const payment = await this.getTransactionModel(testMode).create(record);


      const payment_data = new PaymentDataDto();
      payment_data.payment = payment;
      payment_data.customer_uid = customer?.uid;
      return payment_data;
    } catch (error) {
      console.log(error);
      
      throw new BadRequestException({
        message: 'Unable to create the payment, please try again',
      });
    }
  }

  async getListPayments(
    from: string,
    limit: number,
    merchant_id: string,
    testMode: boolean,
  ) {
    return await this.getTransactionModel(testMode)
      .find({
        merchant_id,
        ...(from ? { _id: { $lt: Types.ObjectId(from) } } : {}),
      })
      .sort({ createdAt: 'desc', _id: 1 })
      .limit(limit);
  }

  async getPreviousPayment(
    currentId: string,
    limit: number,
    testMode: boolean,
  ): Promise<Transaction> {
    const data = await this.getTransactionModel(testMode)
      .find({ _id: { $gt: Types.ObjectId(currentId) } })
      .sort({ createdAt: 'desc', _id: 1 })
      .skip(limit)
      .limit(1);

    if (data?.length) return data[0];
    return null;
  }

  async getNextPayment(
    currentId: string,
    limit: number,
    testMode: boolean,
  ): Promise<Transaction> {
    const data = await this.getTransactionModel(testMode)
      .find({ _id: { $lt: Types.ObjectId(currentId) } })
      .sort({ createdAt: 'desc', _id: 1 })
      .skip(limit)
      .limit(1);

    if (data?.length) return data[0];
    return null;
  }

  async getPayemntWithRefunds(uid, merchant_id, from, limit, testMode) {
    const data = await this.getTransactionModel(testMode)
      .findOne({ uid, merchant_id }, { refunds: 1, uid: 1 })
      .populate({
        path: 'refunds',
        model: !testMode ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
        match: { _id: { $lt: Types.ObjectId(from) } },
        options: {
          limit,
          sort: { createdAt: 'desc', _id: 1 },
        },
      });
    return data?.refunds;
  }

  async getNextRefund(
    uid: string,
    merchant_id: string,
    currentId: string,
    limit: number,
    testMode: boolean,
  ) {
    const data = await this.getTransactionModel(testMode)
      .findOne({ uid, merchant_id }, { refunds: 1, uid: 1 })
      .populate({
        path: 'refunds',
        model: !testMode ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
        match: { _id: { $lt: Types.ObjectId(currentId) } },
        options: {
          limit: 1,
          skip: limit,
          sort: { createdAt: 'desc', _id: 1 },
        },
      });
    return data?.refunds[0];
  }

  async getPreviousRefund(
    uid: string,
    merchant_id: string,
    currentId: string,
    limit: number,
    testMode: boolean,
  ) {
    const data = await this.getTransactionModel(testMode)
      .findOne({ uid, merchant_id }, { refunds: 1, uid: 1 })
      .populate({
        path: 'refunds',
        model: !testMode ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
        match: { _id: { $gt: Types.ObjectId(currentId) } },
        options: {
          limit: 1,
          skip: limit,
          sort: { createdAt: 'desc', _id: 1 },
        },
      });
    return data?.refunds[0];
  }

  async getRefund(merchant_id, paymentUid, refund_uid, testMode) {
    const data = await this.getTransactionModel(testMode)
      .findOne(
        { uid: paymentUid, merchant_id },
        { refunds: 1, uid: 1, orderId: 1 },
      )
      .populate({
        path: 'refunds',
        model: !testMode ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
      });

    if (data?.refunds) {
      const index = data?.refunds.findIndex((item) => item?.uid === refund_uid);
      if (index >= 0) {
        return data?.refunds[index];
      }
    }

    return null;
  }

  async deleteRefund(merchant_id, paymentUid, refund_uid, testMode) {
    const data = await this.getTransactionModel(testMode)
      .findOne(
        { uid: paymentUid, merchant_id },
        { refunds: 1, uid: 1, orderId: 1 },
      )
      .populate({
        path: 'refunds',
        model: !testMode ? DB_TRANSACTION_REFUNDS : DB_TRANSACTION_REFUNDS_TEST,
      });

    if (data?.refunds) {
      const index = data?.refunds.findIndex((item) => item?.uid === refund_uid);
      if (index >= 0) {
        //data.refunds = data?.refunds.some(refund)
        // delete the refund and delete the id on refunds array in transaction
        return data?.refunds[index];
      }
    }

    throw new BadRequestException({
      message: 'Invalid transaction or refund ID',
    });
  }

  async getCustomerById(id: string, testmode: boolean) {
    return await this.customersService.getCustomerByID(id, testmode);
  }

  private getTransactionModel(testMode: boolean): Model<Transaction> {
    return !testMode ? this.transactionModel : this.transactionModelTest;
  }
}
