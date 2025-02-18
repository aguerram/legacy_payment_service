import { Module } from '@nestjs/common';
import { BincodeModule } from 'src/bincode/bincode.module';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { UnnamedController } from './unnamed.controller';
import { UnnamedService } from './unnamed.service';

@Module({
  imports: [TransactionsModule,MerchantsModule,BincodeModule],
  controllers: [UnnamedController],
  providers: [UnnamedService],
})
export class UnnamedModule {}
