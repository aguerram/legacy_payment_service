import { EmailEventTypes } from './../events/event-types';
import { MailingService } from 'src/mailing/mailing.service';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EmailCustomerTransactionEvent,
  EmailEvent,
  EmailMerchantTransactionEvent,
} from '../events/email.events';
import {
  getCustomerPaidOrderHtml,
  getPurchaseConfirmationHtml,
} from 'src/shared/html_mail_templates';
import { format_date_only } from 'src/shared/helpers';

@Injectable()
export class EmailsEventListeners {
  constructor(private mailingService: MailingService) {}

  @OnEvent(EmailEventTypes.WELCOME, { async: true })
  handleWelcomeEmailEvent(payload: EmailEvent) {
    this.sendGeneralEmail(payload);
  }

  @OnEvent(EmailEventTypes.RESET_PASSWORD, { async: true })
  handleResetPasswdEmailEvent(payload: EmailEvent) {
    this.sendGeneralEmail(payload);
  }

  @OnEvent(EmailEventTypes.PASSWORD_CHANGED, { async: true })
  handlePasswdChangedEmailEvent(payload: EmailEvent) {
    this.sendGeneralEmail(payload);
  }

  @OnEvent(EmailEventTypes.CONFIRM_EMAIL, { async: true })
  handleEmailConfirmationEvent(payload: EmailEvent) {
    this.sendGeneralEmail(payload);
  }

  @OnEvent(EmailEventTypes.MERCHANT_TRANSACTION, { async: true })
  handleEmailMerchantTransactionEvent(payload: EmailMerchantTransactionEvent) {
    const {
      email,
      fullName,
      subject,
      amount,
      fees,
      customerName,
      currency,
      testMode,
      orderId,
      paidAt,
      cardBrand,
      cardNumber,
    } = payload;
    this.mailingService.sendMessage(
      email,
      fullName,
      subject,
      getCustomerPaidOrderHtml(
        amount,
        fees.toFixed(2),
        currency,
        orderId,
        paidAt.getTime(),
        cardBrand,
        cardNumber,
        customerName,
        fullName,
        testMode,
      ),
    );
  }

  @OnEvent(EmailEventTypes.CUSTOMER_TRANSACTION, { async: true })
  handleEmailCustomerTransactionEvent(payload: EmailCustomerTransactionEvent) {
    const {
      email,
      fullName,
      subject,
      amount,
      currency,
      testMode,
      transaction_uid,
      paidAt,
      cardBrand,
      cardNumber,
      merchantLegalName,
      merchantEmail,
      checkoutLogo,
    } = payload;
    this.mailingService.sendMessage(
      email,
      fullName,
      subject,
      getPurchaseConfirmationHtml(
        merchantLegalName,
        merchantEmail,
        transaction_uid,
        amount,
        currency,
        format_date_only(paidAt.getTime()),
        cardNumber,
        cardBrand,
        checkoutLogo,
        fullName,
        testMode,
      ),
    );
  }

  //? -------  General Email Layout ----- ?//
  async sendGeneralEmail(payload: EmailEvent) {
    const { url, email, subject, fullName, templateName } = payload;
    await this.mailingService.sendTemplate(
      email,
      fullName,
      subject,
      templateName,
      [],
      [
        {
          name: 'url',
          content: url,
        },
        {
          name: 'name',
          content: fullName,
        },
      ],
    );
  }
}
