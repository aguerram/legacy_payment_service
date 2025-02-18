import { createParamDecorator } from '@nestjs/common';
export const DeveloperIsLiveKey = createParamDecorator(
  (data, req): boolean => {
    return Boolean(req.args[0].isLiveKey)
  },
);
