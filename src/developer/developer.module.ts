import { forwardRef, Module } from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { DeveloperController } from './developer.controller';
import { DeveloperDAO } from './developer.dao';
import { MongooseModule } from '@nestjs/mongoose';
import { DeveloperSchema } from './model/developer.schema';
import { DB_DEVELOPER, DB_DEVELOPER_TEST } from 'src/shared/constants';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DB_DEVELOPER,
        schema: DeveloperSchema,
      },
      {
        name: DB_DEVELOPER_TEST,
        schema: DeveloperSchema,
      },
    ]),
    MerchantsModule,
    forwardRef(() => TransactionsModule),
  ],
  providers: [DeveloperService, DeveloperDAO],
  controllers: [DeveloperController],
  exports: [DeveloperService, DeveloperDAO],
})
export class DeveloperModule {}
