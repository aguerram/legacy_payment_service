import { createParamDecorator } from '@nestjs/common';
import { Merchant } from './merchant.interfaces';

export const GetMerchant = createParamDecorator(
  (data, req): Merchant => {
    return req.args[0].user; // sometimes its req.user
  },
);
