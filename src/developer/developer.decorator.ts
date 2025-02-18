import { createParamDecorator } from '@nestjs/common';
import { DeveloperI } from './model/developer.schema';
export const GetDeveloperInfo = createParamDecorator(
  (data, req): DeveloperI => {
    return req.args[0].developer
  },
);
