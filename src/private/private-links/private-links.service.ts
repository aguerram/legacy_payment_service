import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LinksService } from 'src/links/links.service';
import {
  ApiResponse,
  format_date_only,
  subMerchantName,
  countryISO2to3,
  isLivePublicKey,
} from 'src/shared/helpers';
import { TransactionRefundsService } from 'src/transactions/refunds.service';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { TransactionsService } from 'src/transactions/transactions.service';
import { CreateTransactionDTO } from './private-links.dto';
import { iso1A3Code } from '@ideditor/country-coder';
import { getPurchaseConfirmationHtml } from 'src/shared/html_mail_templates';
import { MailingService } from 'src/mailing/mailing.service';
import { InjectModel } from '@nestjs/mongoose';
import { DB_MERCHANT, DEVELOPER_PKT_PREFIX } from 'src/shared/constants';
import { Model } from 'mongoose';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { ChargesService } from 'src/transactions/charges.service';
import {
  CreateChargeDTO,
  UpdateChargeDTO,
} from 'src/transactions/transaction.dto';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { SettingsDAO } from 'src/merchants/settings.dao';
import { CHARGE_METHOD } from 'src/shared/enums';
@Injectable()
export class PrivateLinksService {
  private logger: Logger = new Logger(PrivateLinksService.name);
  constructor(
    private readonly linksService: LinksService,
    private readonly transactionService: TransactionsService,
    private readonly transactionRefundService: TransactionRefundsService,
    private readonly mailingService: MailingService,
    private readonly developerDAO: DeveloperDAO,
    private readonly chargesService: ChargesService,
    private readonly eventEmitter: EventEmitter2,
    private readonly settingsDAO: SettingsDAO,
    @InjectModel(DB_MERCHANT) private merchantModel: Model<Merchant>,
  ) {}

  async getMerchantActiveMethods(pk: string) {
    const developer = await this.developerDAO.getDeveloperByPublicKey(pk);
    if (!developer) throw new NotFoundException();
    const active = await this.settingsDAO.getMerchantActiveMethodsLive(
      developer.merchant_uid,
      null,
      !isLivePublicKey(pk)
    );
    if (!active) throw new NotFoundException();
    const data = {
      methods: active,
      mode: isLivePublicKey(pk) ? 'live' : 'test',
    };
    return new ApiResponse(0, data, !!active);
  }
  async getTransactionCharge(tr_uid: string, charge_uid: string) {
    const charge = await this.chargesService.getCharge(tr_uid, charge_uid);
    return new ApiResponse(0, charge, !!charge);
  }

  async createTransacitonCharge(
    transaction_uid: string,
    data: CreateChargeDTO,
  ) {
    const charge = await this.chargesService.initCharge(transaction_uid, data);
    return new ApiResponse(0, charge, !!charge);
  }

  async updateTransactonCharge(
    transaction_uid: string,
    charge_uid: string,
    data: UpdateChargeDTO,
  ) {
    const charge = await this.chargesService.updateCharge(
      transaction_uid,
      charge_uid,
      data,
    );
    return new ApiResponse(0, charge, !!charge);
  }

  async getMerchantUIDByPublicKey(pkey: string) {
    this.logger.log(`Checking merchant by public key ${pkey}`);
    const developer = await this.developerDAO.getDeveloperByPublicKey(pkey);

    if (developer) {
      this.logger.log(
        `merchant of pkey ${pkey} has been found ${developer.merchant_uid}`,
      );
    } else {
      this.logger.error(`merchant of pkey ${pkey} doesn't exist.`);
    }

    return new ApiResponse(
      0,
      developer ? developer.merchant_uid : null,
      !!developer?.merchant_uid,
    );
  }

  async getLink(uid: string) {
    const data = await this.linksService.getLinkByUID(uid);
    const merchant = await this.linksService.getMerchant(data.merchant._id);
    const country = iso1A3Code(merchant.organization?.countryCode || 'QA');
    const trading = merchant.organization.legalName;
    const merchantUID = merchant.uid;
    return new ApiResponse(
      0,
      { link: data, country, trading, merchantUID },
      !!data,
    );
  }
  async updateLinkStatus(uid: string) {
    await this.linksService.changeLinkStatusToPaid(uid);
    return new ApiResponse(0);
  }

  async createTransaction(transaction: CreateTransactionDTO) {
    try {
      const payment = await this.transactionService.createPayment(transaction);
      return new ApiResponse(0, payment, !!payment);
    } catch (error) {
      console.log('Unable to create the transaction', error);
    }
    return new ApiResponse(0, null, false);
  }

  async getPaymentByPaymentToken(paymentToken: string, testMode: boolean) {
    try {
      this.logger.log(`Trying to get payment by token ${paymentToken}`);
      const payment = await this.transactionService.getPaymentByPaymentToken(
        paymentToken,
        testMode,
      );
      if (payment) {
        this.logger.log(`Payment token ${paymentToken} exist.`);
      } else {
        this.logger.error(`Payment token ${paymentToken} doesn't exist.`);
      }
      return new ApiResponse(0, payment, !!payment);
    } catch (error) {
      this.logger.log(`Trying to get payment by token ${paymentToken} failed`);
      this.logger.error(error);
    }
    return new ApiResponse(0, null, false);
  }

  async getPayment(transaction_uid: string) {
    try {
      const payment = await this.transactionService.getPayment(transaction_uid);
      return new ApiResponse(0, payment, !!payment);
    } catch (ex) {
      console.log(ex);
    }
    return new ApiResponse(0, null, false);
  }

  private async sendEmailNotification(
    transaction: Transaction,
    merchant: Merchant,
    testMode: boolean,
  ) {
    const { email, name } = transaction?.customer;
    const charge = await this.chargesService.findChargeByID(
      transaction.lastCharge.id,
      testMode,
    );
    let subject = `Purchase Confirmation`;
    await this.mailingService.sendMessage(
      email,
      name,
      subject,
      getPurchaseConfirmationHtml(
        merchant?.organization?.legalName,
        merchant?.accounts[0]?.email,
        transaction.uid,
        transaction.amount,
        transaction.currency,
        format_date_only(transaction.paidAt.getTime()),
        charge?.methodDetails?.cardNumber,
        charge?.methodDetails?.cardBrand,
        merchant?.settings?.checkout?.logo?.path,
        name,
        testMode,
      ),
    );
  }

  async getChargeByOrderID(orderID: string, testMode: boolean) {
    const charge = await this.chargesService.findChargeByOrderID(
      orderID,
      testMode,
    );
    return new ApiResponse(0, charge, !!charge);
  }

  async findTransactionByUID(uid: string) {
    const transaction = await this.transactionService.findByUID(uid);
    return new ApiResponse(0, transaction, !!transaction);
  }
  async findRefundByUID(uid: string) {
    const refund = await this.transactionRefundService.getRefundByUID(uid);

    return new ApiResponse(0, refund, !!refund);
  }

  async getMerchantGateway(uid: string, method: CHARGE_METHOD) {
    const merchant = await this.merchantModel
      .findOne({ uid })
      .populate('settings');
    if (!merchant) throw new NotFoundException();
    if (!merchant.settings) {
      this.logger.error(`Settings for merchant ${merchant.uid} is missing.`);
      throw new NotFoundException();
    }
    const gateway = merchant.settings?.methods[method]?.options?.gateway;
    if (!gateway)
      this.logger.error(`Gateway was not found for merchant ${merchant.uid}`);
    return new ApiResponse(0, gateway, !!gateway);
  }
  async getMerchant(uid: string) {
    const merchant = await this.merchantModel
      .findOne({ uid })
      .select({
        payout: 0,
        accounts: 0,
        representative: 0,
      })
      .populate('settings');
    if (!merchant) throw new NotFoundException();
    return new ApiResponse(0, merchant, !!merchant);
  }

  async getMerchantSubMerchantInfo(uid: string) {
    const merchant = await this.merchantModel.findOne({ uid }).select({
      accounts: 1,
      organization: 1,
      uid: 1,
    });
    if (!merchant || !merchant.organization || !(merchant.accounts?.length > 0))
      throw new NotFoundException();

    return new ApiResponse(
      0,
      {
        identifier: merchant.uid,
        address: {
          city: 'Doha',
          company: subMerchantName(merchant.organization.legalName),
          country: countryISO2to3(merchant.organization.countryCode),
        },
        email: merchant.accounts[0].email,
        phone: merchant.accounts[0].phone,
        registeredName: subMerchantName(merchant.organization.legalName),
        tradingName: subMerchantName(merchant.organization.legalName),
      },
      true,
    );
  }
}
