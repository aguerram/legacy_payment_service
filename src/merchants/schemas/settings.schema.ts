import * as mongoose from 'mongoose';
import { CHARGE_METHOD } from 'src/shared/enums';

export const SettingsSchema = new mongoose.Schema({
  checkout: {
    logo: {
      _id: false,
      type: {
        path: String,
        key: String,
      },
      default: null,
    },
    buttonColor: {
      type: String,
      default: '#33cc66',
    },
  },

  methods: {
    [CHARGE_METHOD.CREDIT_CARD]: {
      enabled: {
        type: Boolean,
        default: true,
      },
      options: {
        gateway: {
          endpoint: String,
          mid: String,
          key: String,
        },
        rate: {
          percentage: {
            type: Number,
            default: 2.9,
          },
          fixed: {
            type: Number,
            default: 1,
          },
          minimumFees: {
            type: Number,
            default: 2.5,
          },
        },
      },
    },
    [CHARGE_METHOD.DEBIT_CARD]: {
      enabled: {
        type: Boolean,
        default: true,
      },
      options: {
        gateway: {
          endpoint: String,
          mid: String,
          key: String,
        },
        rate: {
          percentage: {
            type: Number,
            default: 2.9,
          },
          fixed: {
            type: Number,
            default: 1,
          },
          minimumFees: {
            type: Number,
            default: 2.5,
          },
        },
      },
    },
    [CHARGE_METHOD.AMEX]: {
      enabled: {
        type: Boolean,
        default: true,
      },
      options: {
        gateway: {
          endpoint: String,
          mid: String,
          key: String,
        },
        rate: {
          percentage: {
            type: Number,
            default: 2.9,
          },
          fixed: {
            type: Number,
            default: 1,
          },
          minimumFees: {
            type: Number,
            default: 2.5,
          },
        },
      },
    },
    [CHARGE_METHOD.APPEL_PAY]: {
      enabled: {
        type: Boolean,
        default: false,
      },
      options: {
        gateway: {
          endpoint: String,
          mid: String,
          key: String,
        },
        rate: {
          percentage: {
            type: Number,
            default: 2.9,
          },
          fixed: {
            type: Number,
            default: 1,
          },
          minimumFees: {
            type: Number,
            default: 2.5,
          },
        },
      },
    },
  },
});
