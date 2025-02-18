import * as mongoose from 'mongoose';
import { DB_SETTINGS } from 'src/shared/constants';
import { ONBOARDING_STATUS, MERCHANT_STATUS } from 'src/shared/enums';
import { AccountSchema } from './account.schema';

export const MerchantSchema = new mongoose.Schema(
  {
    uid: String,
    status: {
      type: MERCHANT_STATUS,
    },
    agreementSigned: Boolean,
    testMode: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    accounts: [AccountSchema],
    organization: {
      legalName: {
        type: String,
        trim: true,
        default:"Unnamed business",
      },
      address: String,
      countryCode: {
        type: String,
        trim: true,
        default:"QA",
      },
      commercialRegistrationNumber: Number,
      agree: {
        type: Boolean,
        default: false,
      },
    },
    representative: {
      fullName: {
        type: String,
        trim: true,
      },
      nationalityCode: String,
      qidNumber: String,
      isUbo: Boolean,
    },
    profile: {
      url: String,
      categoryCode: Number,
      offeredProductsAndServices: String,
      targetCustomer: String,
      paymentsVolume: String,
    },
    onboarding: {
      status: {
        type: String,
        default: ONBOARDING_STATUS.NEEDS_DATA,
      },
      flatRate: Number,
      commissionRate: String,
      orgCommercialRegistrationDoc: { key: String, path: String },
      orgComputerCardDoc: {
        key: String,
        path: String,
      },
      bankAccountStatement: {
        key: String,
        path: String,
      },
      qidDoc: [
        {
          _id: false,
          key: String,
          path: String,
        },
      ],
      otherDoc: [
        {
          _id: false,
          key: String,
          path: String,
        },
      ],
      submittedAt: Date,
    },
    payout: {
      bankName: String,
      accountName: String,
      IBAN: String,
    },
    settings:{
      type:mongoose.Schema.Types.ObjectId,
      ref:DB_SETTINGS
    }
  },
  {
    timestamps: true,
  },
);
