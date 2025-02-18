import {
  BASE_URL,
  RESPONSE_TYPE,
  RESSOURCES,
  FRONT_URL,
  MODE,
  DOCS_URLS,
  PAYMENT_SERVICE_URL,
} from 'src/shared/constants';
import { WebLinkDto } from 'src/shared/dto/navigate_links_dto';
import {
  Payments_LinksDto,
  GetPaymentDto,
  PaymentDataDto,
} from './payments.dto';
import { isTestModeUID } from 'src/shared/helpers';
import { Logger } from '@nestjs/common';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { CHARGE_METHOD, TRANSACTION_STATUS } from 'src/shared/enums';

export class GetPayment {
  private static logger: Logger = new Logger(GetPayment.name);
  private static getNAPSCheckoutLink(payment: Transaction, pkey: string) {
    if (!PAYMENT_SERVICE_URL) {
      this.logger.error(
        `Canno't create naps checkout link as 'PAYMENT_SERVICE_URL' is missing`,
      );
      return null;
    }
    return `${PAYMENT_SERVICE_URL}/v1/payments/redirect/debitcard/${payment?.paymentToken}`;
  }

  private static getCheckoutLink(payment: Transaction, pkey: string) {
    switch (payment.method) {
      case CHARGE_METHOD.DEBIT_CARD:
        return GetPayment.getNAPSCheckoutLink(payment, pkey);
      default:
        return `${FRONT_URL}/payscreen/${payment?.paymentToken}`;
    }
  }

  static mapper(
    payment_data: PaymentDataDto & { key?: string },
    doc_url: string = DOCS_URLS.GET_PAYMENT,
  ) {
    const payment = payment_data?.payment;
    const data = new GetPaymentDto();
    data.resource = RESSOURCES.PAYMENT;
    data.amount = payment.amount;
    data.createdAt = payment.createdAt;
    data.updatedAt = payment.updatedAt;
    data.currency = payment.currency;
    data.status = payment.status;
    data.id = payment.uid;
    data.mode = isTestModeUID(payment.uid) ? MODE.TEST : MODE.LIVE;
    data.description = payment.description;
    data.redirectUrl = payment.redirectUrl;
    data.webhookUrl = payment.webhookUrl;
    data.expiresAt = payment.expiresAt;
    data.paymentToken = payment.paymentToken;
    data.metadata = payment.metadata;
    data.method = payment?.method || payment?.lastCharge?.method;
    const self = new WebLinkDto(
      `${BASE_URL}/v1/payments/${payment?.uid}`,
      RESPONSE_TYPE.JSON,
    );
    if(payment.status===TRANSACTION_STATUS.FAILED){
      data.details = {
        failureMessage: payment.lastCharge.failure.message,
        failureReason:payment.lastCharge.failure.code
      }
    }
    const dashboard = new WebLinkDto(`${FRONT_URL}/payments/${payment?.uid}`);
    const customer = payment_data?.customer_uid
      ? new WebLinkDto(
          `${FRONT_URL}/customers/${payment_data?.customer_uid}`,
          RESPONSE_TYPE.JSON,
        )
      : null;
    const refunds =
      payment?.refunds?.length > 0
        ? new WebLinkDto(
            `${FRONT_URL}/payments/${payment?.uid}/refunds`,
            RESPONSE_TYPE.JSON,
          )
        : null;
    const checkout = new WebLinkDto(
      GetPayment.getCheckoutLink(payment, payment_data.key),
      RESPONSE_TYPE.HTML,
    );
    data._links = new Payments_LinksDto(
      self,
      dashboard,
      customer,
      refunds,
      doc_url,
      checkout,
    );
    return data;
  }
}
