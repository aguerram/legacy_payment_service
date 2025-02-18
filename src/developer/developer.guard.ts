import {  DEVELOPER_SKL_PREFIX, DEVELOPER_SKT_PREFIX } from '../shared/constants';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DeveloperDAO } from './developer.dao';
import { MerchantsService } from 'src/merchants/merchants.service';
import { ONBOARDING_STATUS } from 'src/shared/enums';

@Injectable()
export class DeveloperGuard implements CanActivate {
  private logger: Logger = new Logger(DeveloperGuard.name);

  constructor(
    protected developerDAO: DeveloperDAO,
    protected merchantService: MerchantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.log('New request to access developer ressources');
    let token = context.getArgs()[0].headers.authorization as string;


    //we check first if the key is valid
    if (
      !token ||
      String(token).trim().length < 8
    ) {
      this.logger.warn('Access denied due to missing credentials');
      return false;
    }

    const tokenOnly = token.substring('Bearer '.length);
    const isLiveKey = String(tokenOnly).trim().startsWith(DEVELOPER_SKL_PREFIX);
    const devData = await this.developerDAO.getDeveloperBySecretKey(tokenOnly,isLiveKey);

    if (!devData || devData.secretKey !== tokenOnly) {
      this.logger.warn('Access denied due to incorrect credentials.');
      return false;
    }

    //now we retrive the merchant from the key
    let merchant = await this.merchantService.findMerchantByUID(
      devData.merchant_uid,
    );
    if (!merchant) {
      this.logger.warn(
        `Access denied due to missing merchant ${devData.merchant_uid} of provided credentials.`,
      );
      return false;
    }
    if (
      merchant.onboarding?.status !== ONBOARDING_STATUS.COMPLETED &&
      isLiveKey
    ) {
      this.logger.warn(
        `You can't use live API yet, until your account is verified : ${devData.merchant_uid}.`,
      );
      return false;
    }

    request.user = merchant;
    request.developer = devData;
    request.isLiveKey = isLiveKey;
    this.logger.log(
      `Access granted to merchant ${merchant?.organization?.legalName}`,
    );
    return true;
  }
}
