import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { MerchantsService } from '../merchants.service';
import * as jwt from 'jsonwebtoken';
import { TokenPayload } from './token.payload';
import { CachingService } from 'src/caching/caching.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {

  constructor(
    protected readonly merchantService: MerchantsService,
    private readonly cacheService: CachingService
  ) {
  }

  async canActivate(context: ExecutionContext) {
    let token = context.getArgs()[0].headers.authorization as string;
    const tokenOnly = token.substring('Bearer '.length)
    let payload: TokenPayload;
    try {
      payload = jwt.verify(tokenOnly, process.env.JWT_SECRET) as TokenPayload;
    } catch (ex) {
      throw new UnauthorizedException();
    }
    const cached = await this.cacheService.cache.get(payload.merchantId)
    if (!cached || String(cached) !== String(tokenOnly))
      throw new UnauthorizedException();

    let user = await this.merchantService.getMerchantById(payload.merchantId);
    context.switchToHttp().getRequest().user = user;
    return Boolean(user);
  }

}
