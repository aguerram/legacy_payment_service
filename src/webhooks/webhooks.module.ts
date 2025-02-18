import { forwardRef, Module } from '@nestjs/common';
import { DeveloperModule } from 'src/developer/developer.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    DeveloperModule,
    forwardRef(()=>TransactionsModule)
  ],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
