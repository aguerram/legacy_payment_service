import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";

import { AdminENV } from "./admin.env";


@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest();

        const authorization = request.headers["authorization"]

        if (!authorization)
            return false

        const token = authorization.substr("Basic ".length) as string

        if (!token || token?.length <= 0)
            return false

        return token === AdminENV.ADMIN_TOKEN
    }

}