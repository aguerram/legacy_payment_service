import { DB_MERCHANT } from 'src/shared/constants';
import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
export const CustomerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      required:true,
    },
    name: {
      type: String,
      trim: true,
    },
    uid:{
      type: String,
      trim: true,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: DB_MERCHANT,
    },
    isBlacklist: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

CustomerSchema.plugin(mongoosePaginate);