import { BalanceSchema } from './schemas/balance.schema';
import { DB_BALANCE, DB_TRANSACTION } from './../shared/constants';
import { Module } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { BalanceController } from './balance.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSchema } from 'src/transactions/schemas/transaction.schema';
import { SettlementsDAO } from './settlement.dao';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_BALANCE,
        schema: BalanceSchema,
      },
      {
        name: DB_TRANSACTION,
        schema: TransactionSchema,
      },
    ]),
  ],
  providers: [BalanceService,SettlementsDAO],
  controllers: [BalanceController],
  exports:[BalanceService,SettlementsDAO]
})
export class BalanceModule {}
