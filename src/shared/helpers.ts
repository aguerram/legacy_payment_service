import * as CryptoJS from 'crypto-js';
import {
  TEST_MODE_PREFIX,
  RESPONSE_TYPE,
  DEVELOPER_PKT_PREFIX,
  AcquirerErrors,
} from './constants';
import * as RequestIp from '@supercharge/request-ip';
import { Request } from 'express';
import moment = require('moment');
import { Merchant } from 'src/merchants/merchant.interfaces';
import { CHARGE_METHOD, ONBOARDING_STATUS, PAYMENT_GATEWAYS } from './enums';
import countries from './data/countries';
import { byIso as countryByIsoLookup } from 'country-code-lookup';
import { WebLinkDto } from './dto/navigate_links_dto';
import axios from 'axios';

export class ApiResponse {
  errorCode: number;
  success: boolean;
  data: any;
  message: string;

  constructor(
    errorCode: number,
    data: any = {},
    success: boolean = true,
    message: string = '',
  ) {
    this.errorCode = errorCode;
    this.success = success;
    this.data = data;
    this.message = message;
  }
}

export class ApiErrorResponse {
  status: number;
  title: string;
  detail: string;
  _links: any;

  constructor(
    status: number = 404,
    title: string = 'Not Found',
    detail: string,
    _links: any = {},
  ) {
    this.status = status;
    this.detail = detail;
    this.title = title;
    this._links = _links;
  }
}

const characters =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateToken(length: number) {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function generateUID(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function getEnumValues(obj) {
  let values: string[] = Object.keys(obj)
    .map((key) => obj[key])
    .filter((x) => !(parseInt(x) >= 0));
  return values;
}

// generate uid
export function generateUIDWithPrefix(prefix, testPrefix = true): string {
  let uid = generateUID(10);
  return `${testPrefix ? `${TEST_MODE_PREFIX}_` : ''}${prefix}_${uid}`;
}

// generate uid for merchant
export function generateMerchantUID(): string {
  const numbers = '0123456789';
  const numbersLength = numbers.length;
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbersLength));
  }
  let year = new Date().getFullYear().toString().substr(-2);
  return `${year}${result}`;
}

export function isTestModeUID(uid: string) {
  if (!uid) return true;
  return uid.startsWith(TEST_MODE_PREFIX);
}

export function parseBooleanValidator({ value }) {
  return value !== 'false' && value !== '0';
}
export function parseBoolean(value) {
  return value !== 'false' && value !== '0';
}

export const socketRoomHelpers = {
  accountRoomPrefix(id: string): string {
    return `ac_${id}`;
  },
  merchantRoomPrefix(id: string): string {
    return `mr_${id}`;
  },
};

/**
 * Function to decrypt cryped text from front using AES
 * @param hash cipher text to decrypt
 */
export const decryptAES = (hash) => {
  const bytes = CryptoJS.AES.decrypt(hash, process.env.CRYPTO_KEY);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
};

/**
 * Upper case the first chacarter
 * @param {string} str
 */
export function ucFirst(str: string) {
  if (!str) return '';
  str = str.trim();
  return str.charAt(0).toUpperCase() + str.substr(1).toLocaleLowerCase();
}

/**
 * Function to format a card number 1234123412341234 => 1234 1234 1234 1234
 * @param {string} cardNumber the number of the card
 * @returns {string}
 */
export function cardFormater(cardNumber: string) {
  if (!cardNumber) return '';
  return [
    cardNumber.substr(0, 4),
    cardNumber.substr(4, 4),
    cardNumber.substr(8, 4),
    cardNumber.substr(12, 4),
  ].join(' ');
}

/**
 * Function to get yesterday date starting from midnight
 * @return {Date}
 */
export function getYesterdayMidnight() {
  let d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Function to get yesterday date at 6 oclock (evening)
 * @return {Date}
 */
export function getYesterdaySixClock() {
  let d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(18, 0, 0, 0);
  return d;
}

export function calculateFees(amount: number, rate) {
  const { fixed, percentage } = rate;
  if (!amount || amount < 1) return 0;
  return fixed + (amount * percentage) / 100;
}

export function parseAmount(amount: number): number {
  return amount ? Number(amount?.toFixed(2)) : 0;
}

export function formatAmount(amount: number, currency: string = 'QAR'): string {
  return `${parseAmount(amount)}`;
}

export function isDateLessThanNow(dateStr) {
  let today = new Date();
  let customDate = new Date(dateStr);
  return customDate < today;
}

export const format_date_only = (date) => {
  if (date) {
    try {
      return moment(date).format('ddd DD/MM/YYYY');
    } catch (ex) {
      return '';
    }
  } else {
    return '';
  }
};

//capitalize all words of a string.
export function capitalizeWords(string) {
  return string.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  });
}

// Capitalize
export function capitalize(string) {
  if (!string) return;
  return string?.charAt(0).toUpperCase() + string?.slice(1);
}

export function accurateMoney(amount: number): number {
  return Math.round(Number(amount) * 100) / 100;
}

export function isNumberBetween(value, min, max) {
  return value >= min && value <= max;
}

export function getDateDiffHours(date_past: Date, date_now: Date = new Date()) {
  let diffInMilliSeconds =
    new Date(date_now).getTime() - new Date(date_past).getTime();
  return Math.floor(diffInMilliSeconds / 36e5);
}

export function getIpFromRequest(req: Request) {
  const ip = RequestIp.getClientIp(req);
  return ip;
}

export function isMerchantAccountActive(merchant: Merchant): boolean {
  return merchant.onboarding?.status === ONBOARDING_STATUS.COMPLETED;
}

export function getMondayDate() {
  let date = new Date();
  let day = date.getDay();
  let prevMonday = new Date();
  // from midnight
  prevMonday.setHours(0, 0, 0, 1);
  if (date.getDay() > 0) {
    prevMonday.setDate(date.getDate() - (day - 1));
  }

  return prevMonday;
}

export function getThreeDaysAfterMondayDate(mondayDate) {
  if (!mondayDate) return;
  let date = new Date(mondayDate);
  date.setDate(date.getDate() + 3);
  return date;
}

export function isSettlemntDays() {
  let date = new Date();
  // because settlement happens on monday that's why 1
  return [1, 2, 3].includes(date.getDay());
}

export function getSameDayNextMonthDate(date: Date = new Date()) {
  var now = new Date(date);
  let nextMonth = new Date();
  if (now.getMonth() == 11) {
    nextMonth = new Date(now.getFullYear() + 1, 0, now.getDate());
  } else {
    nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
  return nextMonth;
}

/**
 * This function takes sub-merchants (legalName,registeredName,tradingName) to make sure they respect
 * mastercard's rules
 * @param content
 */
export function subMerchantName(content: string) {
  return content.substring(0, 21);
}
/**
 * Convert country iso 2 chars to 3 chars
 * @param countryCode2
 * @returns
 */
export function countryISO2to3(countryCode2: string) {
  const country = countryByIsoLookup(countryCode2);
  return country.iso3;
}
export function countryCodeToCountry(countryCode: string) {
  return countries[countryCode];
}

export function generateNavigateLink(
  link: string,
  from: string,
  limit: number,
): WebLinkDto {
  if (!from) return null;

  const url = `${link}?from=${from}&limit=${limit}`;

  return new WebLinkDto(url, RESPONSE_TYPE.JSON);
}

/**
 * get 10 days before today date
 * return : Date
 */

export function getTenDaysBeforeToday() {
  return new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
}

export function isLivePublicKey(key: string) {
  return !String(key).trim().startsWith(DEVELOPER_PKT_PREFIX);
}

export function chargeMethodToPaymentGateway(
  method: CHARGE_METHOD,
): PAYMENT_GATEWAYS {
  if (method === CHARGE_METHOD.DEBIT_CARD) return PAYMENT_GATEWAYS.NAPS;
  return PAYMENT_GATEWAYS.MPGS;
}

/**
 * the function return card number with spaces ex 123456xxxxxx1234 =>  1234 56xx xxxx 1234
 * @param cardNumber
 * @returns
 */
export function formatCardNumber(cardNumber): string {
  if (!cardNumber) return '';

  let text = cardNumber?.match(/.{1,4}/g);
  return text.join(' ');
}

function returnObject(key: string) {
  return {
    code: key,
    message: AcquirerErrors[key],
  };
}

export type ParseErrorFromMasterCardMetadataType = {
  code: string;
  message: string;
};

export function parseErrorFromMasterCardMetadata(
  metadata: any,
): ParseErrorFromMasterCardMetadataType {
  const { response, risk, sourceOfFunds } = metadata || {};
  if (!response) return null;
  const { acquirerCode, gatewayCode } = response;
  if (!acquirerCode && !gatewayCode) returnObject('unknown_reason');

  //generic_decline
  if (['56', '03', '04', '05', '41', 'W1', 'W2', 'W9'].includes(acquirerCode)) {
    return returnObject('generic_decline');
  }
  if (['51'].includes(acquirerCode)) {
    return returnObject('insufficient_funds');
  }
  if (
    ['01', '06', '22', '67', '91', '92', '04', '31', '63', '70', '03'].includes(
      acquirerCode,
    )
  ) {
    return returnObject('refused_by_issuer');
  }
  if (['34', '43'].includes(acquirerCode)) {
    return returnObject('possible_fraud');
  }
  if (
    ['57', '58'].includes(acquirerCode) ||
    (gatewayCode === 'BLOCKED' &&
      risk?.response?.rule[0]?.name === 'MSO_BIN_RANGE')
  ) {
    const fundingMethod = sourceOfFunds.provided.card.fundingMethod;
    if (fundingMethod) {
      const error = returnObject('not_permitted');
      let failureMessage = error.message;
      if (fundingMethod === 'DEBIT') {
        failureMessage = failureMessage
          .replace('[debit]', 'debit')
          .replace('[credit]', 'credit');
      } else {
        failureMessage = failureMessage
          .replace('[debit]', 'credit')
          .replace('[credit]', 'debit');
      }
      error.message = failureMessage;
      return error;
    }
  }
  if (['62'].includes(acquirerCode)) {
    return returnObject('restricted_card');
  }
  if (
    gatewayCode === 'BLOCKED' &&
    risk?.response?.rule[1]?.name === 'MSO_IP_ADDRESS_RANGE'
  ) {
    return returnObject('restricted_ip');
  }
  if (['06', '56', '12', '15', '30', '42'].includes(acquirerCode)) {
    return returnObject('invalid_card');
  }
  if (['14'].includes(acquirerCode)) {
    return returnObject('invalid_card_number');
  }
  if (['54'].includes(acquirerCode)) {
    return returnObject('invalid_expiry_date');
  }
  if (['82'].includes(acquirerCode)) {
    return returnObject('invalid_cvv');
  }
  if (['61'].includes(acquirerCode)) {
    return returnObject('withdrawal_count_limit_exceeded');
  }

  return returnObject('unknown_reason');
}

// get ip info
export async function getIPCountryCode(ip: string) {
  if (!ip) return '';

  const info = await axios.get(`https://ipinfo.io/${ip}/json`);
  return info?.data?.country || '';
}
