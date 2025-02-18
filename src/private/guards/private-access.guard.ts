import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { decode } from 'base-64';
import {
  PRIVATE_ACCESS_PASSWORD,
  PRIVATE_ACCESS_USERNAME,
} from 'src/shared/constants';
@Injectable()
export class PrivateAccessGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const authorization = request.headers['authorization'];

    if (!authorization) return false;

    const token = authorization.substr('Basic '.length);
    const split = decode(token)?.split(':');

    if (!split) return false;

    const username = split[0];
    const password = split[1];
    return (
      username === PRIVATE_ACCESS_USERNAME &&
      password === PRIVATE_ACCESS_PASSWORD
    );
  }
}
