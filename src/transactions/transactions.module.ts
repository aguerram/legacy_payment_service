import { MailingService } from './../mailing/mailing.service';
import { MerchantSchema } from 'src/merchants/schemas/merchant.schema';
import { TransactionEventsService } from './events.service';
import { TransactionRefundsService } from './refunds.service';
import { forwardRef, Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import {
  DB_TRANSACTION,
  DB_TRANSACTION_EVENTS,
  DB_TRANSACTION_EVENTS_TEST,
  DB_TRANSACTION_REFUNDS,
  DB_TRANSACTION_REFUNDS_TEST,
  DB_TRANSACTION_TEST,
  DB_MERCHANT,
  DB_CUSTOMER,
  DB_CUSTOMER_TEST,
  DB_CHARGE,
  DB_GATEWAY_RESPONSE,
  DB_CHARGE_TEST,
} from 'src/shared/constants';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSchema } from './schemas/transaction.schema';
import { EventSchema } from './schemas/event.schema';
import { RefundSchema } from './schemas/refund.schema';
import { ExportService } from './export/export.service';
import { WebclientService } from 'src/webclient/webclient.service';
import { CustomerSchema } from 'src/customers/schemas/customer.schema';
import { CustomersService } from 'src/customers/customers.service';
import { TransactionsDAO } from './transaction.dao';
import { ChargesService } from './charges.service';
import { ChargeSchema } from './schemas/charge.schema';
import { GatewayResponseSchema } from './schemas/gateway-response.schema';
import { PaymentResponseService } from './payment.response.service';
import { ChargeListener } from './listeners/charge.listener';
import { WebhooksModule } from 'src/webhooks/webhooks.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { DeveloperModule } from 'src/developer/developer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_CUSTOMER,
        schema: CustomerSchema,
      },
      //Test mode
      {
        name: DB_CUSTOMER_TEST,
        schema: CustomerSchema,
      },
      {
        name: DB_TRANSACTION,
        schema: TransactionSchema,
      },
      {
        name: DB_MERCHANT,
        schema: MerchantSchema,
      },
      {
        name: DB_TRANSACTION_EVENTS,
        schema: EventSchema,
      },
      {
        name: DB_TRANSACTION_REFUNDS,
        schema: RefundSchema,
      },
      {
        name: DB_TRANSACTION_TEST,
        schema: TransactionSchema,
      },
      {
        name: DB_TRANSACTION_EVENTS_TEST,
        schema: EventSchema,
      },
      {
        name: DB_TRANSACTION_REFUNDS_TEST,
        schema: RefundSchema,
      },
      {
        name: DB_CHARGE,
        schema: ChargeSchema,
      },
      {
        name: DB_CHARGE_TEST,
        schema: ChargeSchema,
      },
      {
        name: DB_GATEWAY_RESPONSE,
        schema: GatewayResponseSchema,
      }
    ]),
    WebhooksModule,
    MerchantsModule,
    DeveloperModule
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionRefundsService,
    TransactionEventsService,
    ExportService,
    MailingService,
    WebclientService,
    CustomersService,
    ChargesService,
    PaymentResponseService,
    TransactionsDAO,
    ChargeListener,
  ],
  exports: [
    TransactionsService,
    TransactionRefundsService,
    TransactionEventsService,
    TransactionsDAO,
    ChargesService,
    PaymentResponseService
  ],
})
export class TransactionsModule {}
