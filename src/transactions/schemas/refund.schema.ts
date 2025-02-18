import { Schema } from 'mongoose';
import { DB_GATEWAY_RESPONSE } from 'src/shared/constants';
import { TRANSACTION_REFUND_STATUS } from "./../../shared/enums";
let { ObjectId } = Schema.Types;


export const RefundSchema = new Schema(
  {
    uid: {
      type: String,
      unique: true
    },
    status: {
      type: TRANSACTION_REFUND_STATUS,
      default: TRANSACTION_REFUND_STATUS.PENDING
    },
    paidAt: Date,
    amount: Number,
    currency: String,
    description: String,
    refundedAt: Date,
    failedAt: Date,
    metadata:{},
    mpgsResponse: {
      type: ObjectId,
      ref: DB_GATEWAY_RESPONSE,
    },
  },
);