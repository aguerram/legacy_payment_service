import { MailingService } from './../mailing/mailing.service';
import { MERCHANT_ACCOUNT_STATUS } from './../shared/enums';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MerchantsService } from 'src/merchants/merchants.service';
import { ONBOARDING_STATUS } from 'src/shared/enums';
import { ApiResponse } from 'src/shared/helpers';
import {
  getRefundApprovedHtml,
  getSettlementHtml,
} from 'src/shared/html_mail_templates';
import { refundEmailDTO, settlementEmailDTO } from './admin.dto';
import { MerchantDAO } from 'src/merchants/merchants.dao';
import { DeveloperDAO } from 'src/developer/developer.dao';

@Injectable()
export class AdminService {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly merchantDao: MerchantDAO,
    private readonly developerDao: DeveloperDAO,
    private readonly mailingService: MailingService,
  ) {}
  async approveMerchant(uid: string) {
    const merchant = await this.merchantsService.findMerchantByUID(uid);
    if (!merchant) throw new NotFoundException();

    if (merchant?.onboarding?.status === ONBOARDING_STATUS.COMPLETED) {
      return new ApiResponse(0, {}, false, 'The merchant is already approved');
    }

    // generate api keys for prod mode
    await this.developerDao.createNewKeys(merchant?.uid, false);

    merchant.onboarding.status = ONBOARDING_STATUS.COMPLETED;
    await merchant.save();

    const res = await this.mailingService.sendTemplate(
      merchant?.accounts[0]?.email,
      merchant?.accounts[0]?.fullName,
      `Welcome ${merchant?.accounts[0]?.fullName}, Let’s Make Some Money!`,
      'merchant-approved',
      [],
      [
        {
          name: 'url',
          content: process.env.FRONT_URL,
        },
        {
          name: 'name',
          content: merchant?.accounts[0]?.fullName,
        },
      ],
    );

    let messageApi =
      'Merchant onbording status have been updated successfully, but unable to notify him by email';
    if (res[0].status === 'sent') {
      messageApi = 'Merchant onbording status have been updated successfully';
    }

    return new ApiResponse(0, {}, true, messageApi);
  }

  async suspendMerchant(uid: string) {
    const merchant = await this.merchantsService.findMerchantByUID(uid);
    if (!merchant) throw new NotFoundException();

    if (merchant?.onboarding?.status === ONBOARDING_STATUS.PENDING) {
      return new ApiResponse(
        0,
        {},
        false,
        'The merchant is already desapproved',
      );
    }

    merchant.onboarding.status = ONBOARDING_STATUS.PENDING;
    merchant.testMode = true;
    await merchant.save();
    return new ApiResponse(
      0,
      {},
      true,
      'Merchant onbording status have been updated successfully',
    );
  }

  async activateMerchantAccount(uid: string, accountID: string) {
    const res = await this.merchantsService.updateMerchantAccountStatus(
      uid,
      accountID,
      MERCHANT_ACCOUNT_STATUS.ACTIVE,
    );
    if (res) {
      return new ApiResponse(
        0,
        {},
        true,
        'The merchant account has been activated successfully',
      );
    } else {
      return new ApiResponse(
        0,
        {},
        false,
        'There was an error while trying to activate the merchant account',
      );
    }
  }

  async deactivateMerchantAccount(uid: string, accountID: string) {
    const res = await this.merchantsService.updateMerchantAccountStatus(
      uid,
      accountID,
      MERCHANT_ACCOUNT_STATUS.DESACTIVE,
    );
    if (res) {
      return new ApiResponse(
        0,
        {},
        true,
        'The merchant account has been deactivated successfully',
      );
    } else {
      return new ApiResponse(
        0,
        {},
        false,
        'There was an error while trying to deactivate the merchant account',
      );
    }
  }

  async emailRefund(uid: string, data: refundEmailDTO) {
    const merchant = await this.merchantsService.findMerchantByUID(uid);
    if (!merchant) throw new NotFoundException();
    const {
      transactionAmount,
      refundAmount,
      currency,
      cardType,
      refundDate,
      transactionDate,
      cardNumber,
    } = data;

    const res = await this.mailingService.sendMessage(
      merchant?.accounts[0]?.email,
      merchant?.accounts[0]?.fullName,
      `Successful Refund of ${refundAmount} ${currency}`,
      getRefundApprovedHtml(
        transactionAmount,
        refundAmount,
        currency,
        transactionDate,
        refundDate,
        cardType,
        cardNumber,
        merchant?.accounts[0]?.fullName,
      ),
    );
    const isSent = res[0]?.status === 'sent';
    return new ApiResponse(
      0,
      {},
      isSent,
      isSent
        ? 'The email has been sent successfully.'
        : 'The was an error while sending the email, please try again.',
    );
  }

  async emailSettlement(uid: string, data: settlementEmailDTO) {
    const merchant = await this.merchantsService.findMerchantByUID(uid);
    if (!merchant) throw new NotFoundException();
    const {
      transactionTotal,
      transactionFees,
      refundsDeducted,
      netTotal,
      settlementReference,
      payoutDate,
      currency,
    } = data;

    const res = await this.mailingService.sendMessage(
      merchant?.accounts[0]?.email,
      merchant?.accounts[0]?.fullName,
      `It's Pay Day! ${netTotal} ${currency} is on it's way to you!`,
      getSettlementHtml(
        transactionTotal,
        transactionFees,
        netTotal,
        refundsDeducted,
        currency,
        payoutDate,
        settlementReference,
        merchant?.accounts[0]?.fullName,
      ),
    );
    const isSent = res[0]?.status === 'sent';

    return new ApiResponse(
      0,
      {},
      isSent,
      isSent
        ? 'The email has been sent successfully.'
        : 'The was an error while sending the email, please try again.',
    );
  }



  

  //! this is private to be removed after
  async generateKeys() {
    console.log("------ generate apis ---------")

    // retrieve merchant with UIDS only
    const merchants = await this.merchantDao.getAllMerchantUIDs();
   
    for (let merchant of merchants) {
      // for test mode
      const apiTest = await this.developerDao.getDeveloperByMerchantUID(
        merchant?.uid,
        true,
      );

      if (!apiTest) {
        await this.developerDao.createNewKeys(merchant.uid, true);
      }
      // for live mode
      const apiLive = await this.developerDao.getDeveloperByMerchantUID(
        merchant?.uid,
        false,
      );

      
      if (!apiLive) {
        await this.developerDao.createNewKeys(merchant.uid, false);
      }
    }
  }
}
