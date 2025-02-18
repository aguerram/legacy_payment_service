import 'dotenv-flow/config';

// collections names
export const DB_MERCHANT = 'merchants';
export const DB_TRANSACTION = 'transactions';
export const DB_TRANSACTION_EVENTS = 'events';
export const DB_TRANSACTION_REFUNDS = 'refunds';
export const DB_LINK = 'links';
export const DB_BALANCE = 'settlements';
export const DB_CUSTOMER = 'customers';
export const DB_DEVELOPER = 'apikeys';
export const DB_GATEWAY_RESPONSE = 'gateway-responses';
export const DB_CHARGE = 'charges';
export const DB_SETTINGS = 'settings';
// test tables
export const DB_TRANSACTION_TEST = `${DB_TRANSACTION}_test`;
export const DB_CUSTOMER_TEST = `${DB_CUSTOMER}_test`;
export const DB_TRANSACTION_EVENTS_TEST = `${DB_TRANSACTION_EVENTS}_test`;
export const DB_TRANSACTION_REFUNDS_TEST = `${DB_TRANSACTION_REFUNDS}_test`;
export const DB_LINK_TEST = `${DB_LINK}_test`;
export const DB_DEVELOPER_TEST = `${DB_DEVELOPER}_test`;
export const DB_CHARGE_TEST = `${DB_CHARGE}_test`;

export const PRIVATE_ACCESS_USERNAME = process.env
  .PRIVATE_ACCESS_USERNAME as string;
export const PRIVATE_ACCESS_PASSWORD = process.env
  .PRIVATE_ACCESS_PASSWORD as string;

export const TEST_MODE_PREFIX =
  (process.env.TEST_MODE_PREFIX as string) || 'test';

export const API_PREFIX = (process.env.API_PREFIX as string) || 'api-internal';

export const FRONT_URL = process.env.FRONT_URL as string;
export const BASE_URL = process.env.BASE_URL as string;
export const API_DOC_URL = process.env.API_DOC_URL as string;
export const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL as string;

export const DEVELOPER_SKL_PREFIX = 'sk_live_';
export const DEVELOPER_PKL_PREFIX = 'pk_live_';
export const DEVELOPER_SKT_PREFIX = 'sk_test_';
export const DEVELOPER_PKT_PREFIX = 'pk_test_';

export const RESSOURCES = {
  PAYMENTS: 'payments',
  PAYMENT: 'payment',
  LINKS: 'payments-links',
  PAYMENT_LINK: 'payment-link',
  CUSTOMRS: 'customers',
  SETTLEMENT: 'settlement',
  SETTLEMENT_LIST: 'settlements',
  PAYMENT_REFUNDS: 'refunds',
  PAYMENT_REFUND: 'refund',
};

export const DOCS_URLS = {
  // payments links docs
  GET_PAYMENT_LINK: `${API_DOC_URL}/payment-links-api/get-payment-link`,
  CREATE_PAYMENT_LINK: `${API_DOC_URL}/payment-links-api/create-payment-link`,
  LIST_PAYMENT_LINKS: `${API_DOC_URL}/payment-links-api/list-payment-link`,

  // settlement docs
  GET_SETTLEMENT: `${API_DOC_URL}/settlements-api/get-settlement`,
  LIST_SETTLEMENTS: `${API_DOC_URL}/settlements-api/list-settlements`,

  // payments docs
  GET_PAYMENT: `${API_DOC_URL}/payments-api/get-payment`,
  CREATE_PAYMENT: `${API_DOC_URL}/payments-api/create-payment`,
  UPDATE_PAYMENT: `${API_DOC_URL}/payments-api/update-payment`,
  CANCEL_PAYMENT: `${API_DOC_URL}/payments-api/cancel-payment`,
  LIST_PAYMENTS: `${API_DOC_URL}/payments-api/list-payments`,

  // refunds docs
  GET_REUFUND: `${API_DOC_URL}/refunds-api/get-refund`,
  CREATE_REFUND: `${API_DOC_URL}/refunds-api/create-refund`,
  CANCEL_REFUND: `${API_DOC_URL}/refunds-api/cancel-refund`,
};

export const API_URLS = {
  PAYMENT_LINKS: `${BASE_URL}/v1/payment-links`,
  PAYMENTS: `${BASE_URL}/v1/payments`,
  SETTLEMENTS: `${BASE_URL}/v1/settlements`,
};

export const RESPONSE_TYPE = {
  JSON: 'application/json',
  HTML: 'text/html',
};

export const RESPONSE_ERROR_URLS = {
  DEFAULT: 'https://docs.dibsy.one/errors',
};

export const MODE = {
  TEST: 'test',
  LIVE: 'live',
};

export const AcquirerErrors = {
  generic_decline:"The card has been declined for an unknown reason.  Please check your card details and try again.",
  insufficient_funds:"There is insufficient balance available on your card. Please use a different card.",
  refused_by_issuer:"The payment has been refused by your card issuer. Please use a different card.",
  possible_fraud:"The payment has been declined as Dibsy suspects it is fraudulent. Please use a different card.",
  not_permitted:"Your [debit] card is not permitted for this type of purchase. Please use a [credit] card.",
  restricted_card:"Your card does not support this type of purchase. Please use a different card.",
  restricted_ip:"Your current location does not match the region associated with the card being used. Please close or disable any VPN programs and try again.",
  invalid_card:"The card, or account the card is connected to, is invalid.Please check your card details and try again.",
  invalid_card_number:"The card number is incorrect. Please check your card details and try again.",
  invalid_expiry_date:"The expiration date is incorrect. Please check your card details and try again.",
  invalid_cvv:"The CVV is incorrect. Please check your card details and try again.",
  withdrawal_count_limit_exceeded:"Your have exceeded your card limit. Please use a different card.",

  unknown_reason:"The card has been declined for an unknown reason.  Please check your card details and try again.",
  authentication_failed:"The card authentication has failed. Please check your card details and try again.",
  authentication_abandoned:"The card authentication was abandoned. Please check your card details and try again.",
};

