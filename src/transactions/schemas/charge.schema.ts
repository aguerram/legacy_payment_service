import { Schema } from 'mongoose';
import { DB_GATEWAY_RESPONSE } from 'src/shared/constants';
import { CHARGE_METHOD, TRANSACTION_CARD_BRAND, TRANSACTION_CHARGE_STATUS, TRANSACTION_METHODS } from "../../shared/enums";
let { ObjectId } = Schema.Types;


export const ChargeSchema = new Schema(
  {
    uid: {
      type: String,
    },
    status: {
      type: TRANSACTION_CHARGE_STATUS,
      default:TRANSACTION_CHARGE_STATUS.PENDING
    },
    //Add timeSpent, userAgent, cardHolderIP to charges
    amount: Number,
    currency: String,
    orderId: String,
    timeSpent: Number,
    userAgent: String,
    cardHolderIP: String,
    method:{
      type:String,
      default:CHARGE_METHOD.CREDIT_CARD
    },
    methodDetails: {
      cardNumber: String,
      deviceSpecificNumber: String,
      cardHolder: String,
      cardCountryCode: String,
      cardIssuer: String,
      funding: {
        type: TRANSACTION_METHODS,
      },
      cardBrand: {
        type: TRANSACTION_CARD_BRAND,
      },
    },
    failure: {
      code: String,
      message: String
    },
    gatewayResponse: {
      type: ObjectId,
      ref: DB_GATEWAY_RESPONSE,
    }
  },
  { timestamps: true },
);