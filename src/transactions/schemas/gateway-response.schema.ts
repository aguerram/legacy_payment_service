import { Schema } from 'mongoose';
import { PAYMENT_GATEWAYS } from 'src/shared/enums';

export const GatewayResponseSchema = new Schema(
  {
    gateway: {
      type: String,
      enum: PAYMENT_GATEWAYS,
      default: PAYMENT_GATEWAYS.MPGS
    },
    details: {
      type: Object,
    },
  },
  { timestamps: true },
);
