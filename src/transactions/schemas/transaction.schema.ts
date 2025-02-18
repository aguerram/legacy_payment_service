import { ChargeSchema } from './charge.schema';
import {
  DB_TRANSACTION_REFUNDS,
  DB_TRANSACTION_EVENTS,
  DB_BALANCE,
} from 'src/shared/constants';
import { DB_MERCHANT, DB_CUSTOMER, DB_CHARGE } from './../../shared/constants';
import { Schema } from 'mongoose';
import {
  CHARGE_METHOD,
  TRANSACTION_STATUS,
} from 'src/shared/enums';
import * as mongoosePaginate from 'mongoose-paginate';

let { ObjectId } = Schema.Types;

export const TransactionSchema = new Schema(
  {
    uid: String,
    status: {
      type: TRANSACTION_STATUS,
      default: TRANSACTION_STATUS.OPEN,
    },
    paidAt: Date,
    failedAt: Date,
    expiresAt: {type:Date,default:null},
    isSmsSent: {
      type: Boolean,
      default: false,
    },
    method:{
      type:String,
      enum:Object.values(CHARGE_METHOD).concat(null),
      default:null,
    },
    amount: Number,
    amount_net: Number,
    fees: Number,
    amountRefunded: Number,
    amountRemaining: Number,
    settlementAmount: Number,
    currency: String,
    description: String,
    metadata: {},
    custom_fields: {},
    locale: String,
    redirectUrl: String,
    webhookUrl: String,
    referrer: String,
    countryCode: String,
    merchant_id: {
      type: ObjectId,
      ref: DB_MERCHANT,
    },
    customer_id: {
      type: ObjectId,
      ref: DB_CUSTOMER,
    },
    linkUID: {type:String,default:null},
    log: {
      cardHolderIp: String,
      timeSpent: Number,
    },
    lastCharge: ChargeSchema,
    charges: [{ type: ObjectId, ref: DB_CHARGE }],
    events: [{ type: ObjectId, ref: DB_TRANSACTION_EVENTS }],
    refunds: [{ type: ObjectId, ref: DB_TRANSACTION_REFUNDS }],
    sessionID: {type:String,default:null},
    paymentToken: {
      type: String,
      unique: true,
    },
    createdBy:String,
    settlement_id: {
      type: ObjectId,
      ref: DB_BALANCE,
    },
    payoutId:String,
  },
  { timestamps: true },
);
TransactionSchema.plugin(mongoosePaginate);
