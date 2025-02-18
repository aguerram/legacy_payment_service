import { Document } from 'mongoose';
import { CHARGE_METHOD } from 'src/shared/enums';

interface SettingsCheckoutI {
  logo: {
    path: string;
    key: string;
  };
  buttonColor: string;
}
interface SettingsMethodOptions {
  gateway?: {
    endpoint: string;
    mid: string;
    key: string;
  };
  rate: {
    percentage: number;
    fixed: number;
    minimumFees: number;
  };
}

export interface SettingsMethodRate {
    percentage: number;
    fixed: number;
    minimumFees?: number;
}

interface SettingsMethodBaseI {
  enabled: boolean;
  options: SettingsMethodOptions;
}

export interface SettingsI {
  checkout: SettingsCheckoutI;
  methods: {
    [CHARGE_METHOD.CREDIT_CARD]: SettingsMethodBaseI;
    [CHARGE_METHOD.DEBIT_CARD]: SettingsMethodBaseI;
    [CHARGE_METHOD.AMEX]: SettingsMethodBaseI;
    [CHARGE_METHOD.APPEL_PAY]: SettingsMethodBaseI;
  };
}

export type Settings = SettingsI & Document;
