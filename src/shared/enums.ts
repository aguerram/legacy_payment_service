export enum MERCHANT_ACCOUNT_STATUS {
  ACTIVE = 'active',
  DESACTIVE = 'desactive',
  PENDING = 'pending',
}

export enum ACCOUNT_ROLE {
  ADMIN = 'admin',
  USER = 'user',
}

export enum MERCHANT_STATUS {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum RESET_TPYE {
  PUBLIC = 'public',
  SECRET = 'secret',
}

export enum ONBOARDING_STATUS {
  PENDING = 'pending',
  NEEDS_DATA = 'needs-data',
  IN_REVIEW = 'in-review',
  COMPLETED = 'completed',
}

export enum LINKS_STATUS {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
}

export enum TRANSACTION_STATUS {
  PARTIALLY_REFUNDED = 'partially refunded',
  REFUNDED = 'refunded',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  SETTLED = 'settled',
  ON_HOLD = 'on hold',
  OPEN = 'open',
}

export enum TRANSACTION_METHODS {
  CREDIT_CARD = 'creditcard',
  DEBIT_CARD = 'debitcard',
}

export enum TRANSACTION_EVENT_STATUS {
  CAPTURED = 'captured',
  DECLINED = 'declined',
}

export enum TRANSACTION_REFUND_STATUS {
  PENDING = 'pending',
  REFUNDED = 'refunded',
  FAILDED = 'failed',
}

export enum TRANSACTION_CARD_BRAND {
  VISA = 'visa',
  MC = 'mastercard',
  AMEX = 'amex',
}

export enum SETTLEMENT_STATUS {
  PENDING = 'pending',
  PAID_OUT = 'paidout',
  FAILED = 'failed',
}

export enum TRANSACTION_EVENT_TYPE {
  INIT_PAYMENT = 'INIT_PAYMENT',
  CHARGE = 'CHARGE',
}

export enum TRANSACTION_CHARGE_STATUS {
  FAILED = 'failed',
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
}

export enum CHARGE_METHOD {
  CREDIT_CARD = 'creditcard',
  DEBIT_CARD = 'debitcard',
  AMEX = 'amex',
  APPEL_PAY = 'applepay',
}
export enum PAYMENT_GATEWAYS {
  NAPS = 'naps',
  MPGS = 'mpgs',
}
