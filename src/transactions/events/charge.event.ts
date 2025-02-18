import { TRANSACTION_EVENT_TYPE } from "src/shared/enums";

export class ChargeEvent {
  transaction_uid: string;
  testMode:boolean;
  message: string;
  eventType:TRANSACTION_EVENT_TYPE
}

