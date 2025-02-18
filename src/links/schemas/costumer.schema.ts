import * as mongoose from 'mongoose';

export const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    phone: String,
    email: String,
    metadata: {
      type: Object,
    },
  }
);
