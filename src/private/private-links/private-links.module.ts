import { MerchantSchema } from 'src/merchants/schemas/merchant.schema';
import { DB_MERCHANT } from 'src/shared/constants';
import { Module } from '@nestjs/common';
import { PrivateLinksService } from './private-links.service';
import { PrivateLinksController } from './private-links.controller';
import { LinksModule } from 'src/links/links.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { MailingService } from 'src/mailing/mailing.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DeveloperModule } from 'src/developer/developer.module';
import { MerchantsModule } from 'src/merchants/merchants.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_MERCHANT,
        schema: MerchantSchema,
      },
    ]),
    LinksModule,
    TransactionsModule,
    DeveloperModule,
    MerchantsModule
  ],
  providers: [PrivateLinksService, MailingService],
  controllers: [PrivateLinksController],
})
export class PrivateLinksModule {}
