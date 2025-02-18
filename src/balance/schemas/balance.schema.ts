import * as mongoose from 'mongoose';
import { DB_TRANSACTION, DB_MERCHANT } from 'src/shared/constants';
import { CURRENCIES } from 'src/shared/currencies';
import * as mongoosePaginate from 'mongoose-paginate';
import {  SETTLEMENT_STATUS } from 'src/shared/enums';

let { ObjectId } = mongoose.Schema.Types;

export const BalanceSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
    },
    uid: {
      type: String,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fees: {
      type: Number,
      required: true,
    },
    amount_net: {
      type: Number,
      required: true,
    },
    refund_deducted: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: CURRENCIES.QAR,
    },
    merchant_id: {
      type: ObjectId,
      required: true,
      ref: DB_MERCHANT,
    },
    settledAt: Date,
    status: {
      type: SETTLEMENT_STATUS,
      default: SETTLEMENT_STATUS.PENDING,
    },

    transactions: [{ type: ObjectId, ref: DB_TRANSACTION }],

    bankAccount: {
      bankName: String,
      beneficiaryName: String,
      IBAN: String,
    },
  },
  {
    timestamps: true,
  },
);

BalanceSchema.plugin(mongoosePaginate);
