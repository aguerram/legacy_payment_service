import { TransactionEvent } from './../transaction.interfaces';
import { Schema } from 'mongoose';
import { TRANSACTION_EVENT_TYPE } from 'src/shared/enums';

export const EventSchema = new Schema({
  uid: String,
  message: String,
  eventDatetime: Date,
  eventType: {
    type: TRANSACTION_EVENT_TYPE,
  },
  
});

EventSchema.pre<TransactionEvent>('save', function (next) {
  const event = this;
  event.eventDatetime = new Date();
  return next();
});
