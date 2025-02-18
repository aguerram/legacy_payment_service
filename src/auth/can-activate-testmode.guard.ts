import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Merchant } from "src/merchants/merchant.interfaces";
import { ONBOARDING_STATUS } from "src/shared/enums";
@Injectable()
export class CanActivateTestmodeGuard implements CanActivate {


    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const merchant: Merchant = request.user
        if (!merchant) return false
        const testMode = request.query?.testMode || request.body?.testMode        
        if (!testMode || testMode === "false") {
            return merchant.onboarding?.status === ONBOARDING_STATUS.COMPLETED
        }
        return true
    }

}