import { TransactionSchema } from './../transactions/schemas/transaction.schema';
import { DB_LINK_TEST, DB_TRANSACTION, DB_TRANSACTION_TEST } from './../shared/constants';
import { Module } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_LINK, DB_MERCHANT } from 'src/shared/constants';
import { LinkSchema } from './schemas/link.schema';
import { MerchantSchema } from 'src/merchants/schemas/merchant.schema';
import { WebclientService } from 'src/webclient/webclient.service';
import { LinksDAO } from './links.dao';
import { DeveloperModule } from 'src/developer/developer.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { MerchantsModule } from 'src/merchants/merchants.module';

@Module({
  imports: [
    DeveloperModule,
    TransactionsModule,
    MerchantsModule,
    MongooseModule.forFeature([
      {
        name: DB_LINK,
        schema: LinkSchema
      },
      {
        name: DB_MERCHANT,
        schema: MerchantSchema
      },
      {
        name: DB_TRANSACTION,
        schema: TransactionSchema
      },
      //Test mode 
      {
        name: DB_LINK_TEST,
        schema: LinkSchema
      },
      {
        name: DB_TRANSACTION_TEST,
        schema: TransactionSchema
      }
    ])
  ],
  providers: [LinksService,WebclientService,LinksDAO],
  controllers: [LinksController],
  exports: [LinksService,LinksDAO]
})
export class LinksModule { }
