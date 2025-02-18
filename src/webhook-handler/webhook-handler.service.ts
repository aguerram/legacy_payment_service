import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { GetPaymentDto } from 'src/api/v1/payments/payments.dto';
import { LinksService } from 'src/links/links.service';
import { LINKS_STATUS, TRANSACTION_STATUS } from 'src/shared/enums';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class WebhookHandlerService {
  private logger: Logger = new Logger(WebhookHandlerService.name);
  constructor(
    private readonly linksService: LinksService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async handlePaymentWebhook(req: Request, merchantUID: string, body: any) {
    this.logger.log(`Accessing webhook to process transaction ${body.uid}`);
    let payment: GetPaymentDto;
    try {
      payment = body as GetPaymentDto;

      if (payment.status === TRANSACTION_STATUS.SUCCEEDED) {
        if (payment.id) {
          const paymentComplete = await this.transactionsService.findByUID(
            payment.id,
          );
          if(!paymentComplete)
          {
            this.logger.error(
              `Skipping webhook process of payment ${payment.id} as it doesn't exist.`,
            );
            return;
          }
          const link = await this.linksService.getLinkByUID(
            paymentComplete.linkUID,
          );
          if (!link) {
            this.logger.error(
              `Skipping webhook process of payment ${payment.id} as it doesn't not have a payment link uid`,
            );
            return;
          }
          link.status = LINKS_STATUS.PAID;
          if(link.reusable){
            link.total_payments++;
          }
          await link.save();
          this.logger.verbose(
            `Webhook of payment ${payment.id} has been processed succesfully, set link ${link.uid} to paid.`,
          );
        } else {
          this.logger.warn(
            `Skipping webhook process of payment ${payment.id} as it doesn't not have a payment link uid`,
          );
        }
      } else {
        this.logger.warn(
          `Skipping webhook process of payment ${payment.id} as it's not successful`,
        );
      }
    } catch (ex) {
      this.logger.error(
        `Error while processing webhook for payment ${payment.id}`,
      );
    }
    return false;
  }
}
