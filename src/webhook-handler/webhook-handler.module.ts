import { Module } from '@nestjs/common';
import { DeveloperModule } from 'src/developer/developer.module';
import { LinksModule } from 'src/links/links.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { WebhookHandlerController } from './webhook-handler.controller';
import { WebhookHandlerService } from './webhook-handler.service';

@Module({
  imports: [DeveloperModule, LinksModule,TransactionsModule],
  controllers: [WebhookHandlerController],
  providers: [WebhookHandlerService],
})
export class WebhookHandlerModule {}
