import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransactionEventsService } from '../events.service';
import { ChargeEvent } from '../events/charge.event';

@Injectable()
export class ChargeListener {
  constructor(private transactionsEventService: TransactionEventsService) {}

  @OnEvent('charge', { async: true })
  handleChargeEvents(payload: ChargeEvent) {
    this.transactionsEventService.saveEvent(payload);
  }
}
