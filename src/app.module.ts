import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';
import { MerchantsModule } from './merchants/merchants.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { MailingModule } from './mailing/mailing.module';
import { FilesModule } from './files/files.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SettingsModule } from './settings/settings.module';
import { LinksModule } from './links/links.module';
import { ApplicationModule } from './application/application.module';
import { CachingModule } from './caching/caching.module';
import { PrivateLinksModule } from './private/private-links/private-links.module';
import { InsightsModule } from './insights/insights.module';
import { BalanceModule } from './balance/balance.module';
import { AdminModule } from './admin/admin.module';
import { CustomersModule } from './customers/customers.module';
import { DeveloperModule } from './developer/developer.module';
import { ApiModule } from './api/api.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebhookHandlerModule } from './webhook-handler/webhook-handler.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UnnamedModule } from './unnamed/unnamed.module';
import { PrivateCheckoutModule } from './private/private-checkout/private-checkout.module';
import { BincodeModule } from './bincode/bincode.module';

@Module({
  imports: [
    AuthModule,
    MerchantsModule,
    EventEmitterModule.forRoot({ wildcard: true }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MailingModule,
    FilesModule,
    TransactionsModule,
    SettingsModule,
    LinksModule,
    ApplicationModule,

    CachingModule,

    PrivateLinksModule,

    InsightsModule,

    BalanceModule,

    AdminModule,

    CustomersModule,
    DeveloperModule,

    ApiModule,

    WebhookHandlerModule,

    WebhooksModule,

    UnnamedModule,

    PrivateCheckoutModule,
    
    BincodeModule
  ],
  // providers: [
  //   {
  //     provide: APP_INTERCEPTOR,
  //     useClass: TransformInterceptor,
  //   }
  // ],
})
export class AppModule {}
