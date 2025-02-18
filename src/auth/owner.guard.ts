import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from "express"
@Injectable()
export class OwnerGuard implements CanActivate {
    merchantKeyName: string;

    /**
     * This guard makes sure that the requested merchant belongs to the user
     * @param {string} merchantKeyName 
     */
    constructor(
        merchantKeyName: string
    ) {
        this.merchantKeyName = merchantKeyName;
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest();

        const user: any = request.user
        if (!user)
            throw new UnauthorizedException()
        const merchantID = request.params[this.merchantKeyName] as string || request.query[this.merchantKeyName] as string || ""
        if (String(user._id) !== merchantID)
            throw new ForbiddenException()
        return true
    }
}