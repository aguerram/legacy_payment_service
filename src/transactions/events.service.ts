import {
  DB_TRANSACTION_EVENTS,
  DB_TRANSACTION_EVENTS_TEST,
} from './../shared/constants';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionEvent } from './transaction.interfaces';
import { generateUIDWithPrefix, isTestModeUID } from 'src/shared/helpers';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransactionEventsService {
  constructor(
    @InjectModel(DB_TRANSACTION_EVENTS)
    private eventModel: Model<TransactionEvent>,

    @InjectModel(DB_TRANSACTION_EVENTS_TEST)
    private eventModelTest: Model<TransactionEvent>,

    private transactionsService: TransactionsService,
  ) {}


  async saveEvent(data: any): Promise<TransactionEvent> {
    const { testMode, transaction_uid, message, eventType } = data;
    const transaction = await this.transactionsService.findByUID(
      transaction_uid,
    );
    const model = this.getEventsModel(testMode);
    const event = await new model({
      message,
      eventType,
    });

    await event.save();
    transaction.events.push(event.id);

    await transaction.save();

    return event;
  }

  async generateChargeUID(testMode) {
    let uid = null;
    while (uid == null) {
      let _uid = generateUIDWithPrefix('evt', testMode);
      let charge = await this.findChargeByUID(_uid);
      if (!charge) {
        uid = _uid;
      }
    }
    return uid;
  }

  async findChargeByUID(uid: string) {
    const testMode = isTestModeUID(uid);
    return await this.getEventsModel(testMode).findOne({ uid });
  }

  getEventsModel(testMode = true): Model<TransactionEvent> {
    return !testMode ? this.eventModel : this.eventModelTest;
  }
}
