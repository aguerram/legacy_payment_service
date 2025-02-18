import { PaymentsController } from './v1/payments/payments.controller';
import { PaymentLinksService } from './v1/payment-links/payment-links.service';
import { Module } from '@nestjs/common';
import { PaymentLinksController } from './v1/payment-links/payment-links.controller';
import { DeveloperModule } from 'src/developer/developer.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { LinksModule } from 'src/links/links.module';
import { SettlementsController } from './v1/settlements/settlements.controller';
import { SettlementsService } from './v1/settlements/settlement.service';
import { BalanceModule } from 'src/balance/balance.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { PaymentsService } from './v1/payments/payments.service';
import { RefundsController } from './v1/refunds/refunds.controller';
import { RefundsService } from './v1/refunds/refunds.service';
import { PrivateCheckoutModule } from 'src/private/private-checkout/private-checkout.module';

@Module({
  imports: [
    DeveloperModule,
    MerchantsModule,
    LinksModule,
    BalanceModule,
    TransactionsModule,
    PrivateCheckoutModule
  ],
  controllers: [
    PaymentLinksController,
    PaymentsController,
    RefundsController,
    SettlementsController,
  ],
  providers: [
    PaymentLinksService,
    PaymentsService,
    RefundsService,
    SettlementsService
  ],
})
export class ApiModule {}
