import * as mongoose from 'mongoose';
import { DB_LINK } from 'src/shared/constants';
import { CURRENCIES } from 'src/shared/currencies';
import { CustomerSchema } from './costumer.schema';
import * as mongoosePaginate from 'mongoose-paginate';
import { LINKS_STATUS } from 'src/shared/enums';
import { ReusableStatus } from '../links.interfaces';

export const LinkSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: CURRENCIES.QAR,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    redirectUrl: {
      type: String,
      trim: true,
    },
    webhookUrl: {
      type: String,
      trim: true
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: DB_LINK,
    },
    reusable: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: Date.now(),
    },
    customerLocale: {
      type: String,
      default: 'en-US',
    },
    notifyWithSms: {
      type: Boolean,
      default: false,
    },
    customer: {
      type: CustomerSchema,
    },
    status: {
      type: LINKS_STATUS,
      default: LINKS_STATUS.PENDING,
    },
    sms_log: {
      last_time_sent: Date,
      number_sms_sent: {
        type: Number,
        default: 0,
      },
    },
    custom_fields: [
      {
        _id: false,
        name: String,
        label: String,
        value: String,
      },
    ],
    total_payments: {
      type: Number,
      default: 0,
    },
    createdBy:String,

  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.reusable = ret.reusable
          ? ReusableStatus.Open
          : ReusableStatus.SingleUse;
        return ret;
      },
    },
  },
);

LinkSchema.plugin(mongoosePaginate);
