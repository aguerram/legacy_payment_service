import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { isTestModeUID } from 'src/shared/helpers';
import {
  generateSignature,
  SIGNATURE_HEADER,
  SIGNATURE_TIMESTEMP_HEADER,
} from 'src/shared/signature';
import { GetPayment } from 'src/api/v1/payments/payments.mappers';
import { PaymentDataDto } from 'src/api/v1/payments/payments.dto';
@Injectable()
export class WebhooksService {
  constructor(
    private readonly developerDAO: DeveloperDAO
  ) {}
  private logger: Logger = new Logger(WebhooksService.name);
  async paymentFinishedWebhook(
    paymentData: PaymentDataDto,
    merchantUID: string,
  ) {
    const payment = paymentData?.payment;
    
    if (!payment) return;
    if (payment.webhookUrl) {
      const isTestMode = isTestModeUID(payment.uid);
      const paymentMapped = GetPayment.mapper(paymentData);
      this.logger.log(
        `Iniaite webhook of payment to send to merchant ${merchantUID}`,
      );
      const developer = await this.developerDAO.getDeveloperByMerchantUID(
        merchantUID,
        isTestMode,
      );
      if (!developer) {
        this.logger.error(
          `Failed to send payment webhook to merchant ${merchantUID}, developer ressource doesn't exist.`,
        );
        return;
      }
      try {        
        const timestamp = Date.now();
        const signature = generateSignature(
          developer.secretKey,
          'POST',
          payment.webhookUrl,
          timestamp,
          paymentMapped,
        );
        await axios({
          url: payment.webhookUrl,
          method: 'POST',
          headers: {
            [SIGNATURE_TIMESTEMP_HEADER]: timestamp,
            [SIGNATURE_HEADER]: signature,
          },
          data: paymentMapped,
        });
      } catch (ex) {
        this.logger.error(
          `Failed to send payment webhook to merchant: ${merchantUID}`,
        );
        this.logger.error(ex);
      }
    }
  }
}
