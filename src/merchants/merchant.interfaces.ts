import { Document } from 'mongoose';
import { MERCHANT_ACCOUNT_STATUS, ONBOARDING_STATUS, MERCHANT_STATUS } from 'src/shared/enums';
import { Settings } from './settings.interface';

export interface Merchant extends Document {
  uid: string;
  status: MERCHANT_STATUS;
  agreementSigned: boolean;
  testMode: boolean;
  signedUpAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  accounts: Account[];
  organization: Organization;
  representative: Representative;
  profile: Profile;
  onboarding: Onboarding;
  payout: Payout;
  settings: Settings;
}



export interface Account extends Document {
  kind: string;
  email: string;
  fullName: string;
  password: string;
  status: MERCHANT_ACCOUNT_STATUS;
  token: string;
  confirmedAt: Date;
  phone: string;
  pendingEmail: string;
}

export interface Organization {
  // agree: boolean;
  legalName: string;
  representative: string;
  address: string;
  countryCode: string;
  commercialRegistrationNumber: number;
}

export interface Representative {
  fullName: string;
  nationalityCode: string;
  qidNumber: string;
  isUbo: boolean;
}

export interface Payout {
  bankName: string;
  accountName: String;
  IBAN: string;
}

export interface Onboarding {
  flatRate: number;
  commissionRate: string;
  orgCommercialRegistrationDoc: { key: string, path: string };
  orgComputerCardDoc: { key: string, path: string };
  qidDoc: { key: string, path: string }[];
  otherDoc: { key: string, path: string }[];
  bankAccountStatement: { key: string, path: string };
  submittedAt: Date;
  status: ONBOARDING_STATUS
}

export interface Profile {
  url: string;
  email: string;
  phone: string;
  categoryCode: number;
  offeredProductsAndServices: string;
  targetCustomer: string;
  paymentsVolume: string;
}

