import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MerchantSchema } from 'src/merchants/schemas/merchant.schema';
import { DB_MERCHANT, DB_TRANSACTION, DB_TRANSACTION_REFUNDS, DB_TRANSACTION_REFUNDS_TEST, DB_TRANSACTION_TEST } from 'src/shared/constants';
import { RefundSchema } from 'src/transactions/schemas/refund.schema';
import { TransactionSchema } from 'src/transactions/schemas/transaction.schema';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_MERCHANT,
        schema: MerchantSchema,
      },
      {
        name: DB_TRANSACTION,
        schema: TransactionSchema,
      },
      {
        name: DB_TRANSACTION_REFUNDS,
        schema: RefundSchema
      },
      //Test mode
      {
        name: DB_TRANSACTION_TEST,
        schema: TransactionSchema,
      },
      {
        name: DB_TRANSACTION_REFUNDS_TEST,
        schema: RefundSchema
      }
    ]),
  ],
  controllers: [InsightsController],
  providers: [InsightsService]
})
export class InsightsModule { }
