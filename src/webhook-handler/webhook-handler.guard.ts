import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import {
  SIGNATURE_HEADER,
  SIGNATURE_TIMESTEMP_HEADER,
  verifySignature,
} from 'src/shared/signature';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { BASE_URL } from 'src/shared/constants';
@Injectable()
export class WebhookHandlerGuard implements CanActivate {
  constructor(private readonly developerDAO: DeveloperDAO) {}
  private logger: Logger = new Logger(WebhookHandlerGuard.name);
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const timestamp = +request.headers[SIGNATURE_TIMESTEMP_HEADER];
    const signature = request.headers[SIGNATURE_HEADER] as string;
    this.logger.log(`Accessing webhook at url ${request.path}`);
    if (!timestamp || !signature) {
      this.logger.error(`Missing timestamp or signaure ${request.path}`);
      return false;
    }
    const merchantUID = request.params['merchantUID'];
    if (!merchantUID) {
      this.logger.error(`merchantUID is missing from the request.`);
      return false;
    }
    const testMode = request.query['testMode'] === 'true' ? true : false;
    const developer = await this.developerDAO.getDeveloperByMerchantUID(
      merchantUID,
      testMode,
    );
    const isValidSignauture = verifySignature(signature, {
      method: request.method,
      uri: `${BASE_URL}${request.originalUrl}`,
      body: request.body,
      secret: developer.secretKey,
      timestamp,
    });    
    return isValidSignauture;
  }
}
