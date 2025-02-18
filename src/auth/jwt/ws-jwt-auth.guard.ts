import { AuthService } from './../auth.service';
import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Socket } from "socket.io";
import { JwtPayload } from "./jwt.payload";

import * as jwt from "jsonwebtoken"
import { WsException } from "@nestjs/websockets";

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('jwt') {

    private logger: Logger = new Logger(WsJwtAuthGuard.name);

    constructor(
        private readonly authService: AuthService
    ) {
        super()
    }

    async canActivate(context: ExecutionContext) {
        const client: Socket = context.switchToWs().getClient();
        const authToken = client.handshake.query.token as string;



        let jwtPayload: JwtPayload;

        try {
            jwtPayload = jwt.verify(authToken, process.env.JWT_SECRET) as JwtPayload;
        }
        catch (ex) {
            this.logger.warn("Unauthorized access attempted to connect to the socket")
            throw new WsException("Unauthorized access")
        }

        const merchant = await this.authService.getMerchantAccountByAccountId(jwtPayload.accountId)

        if (!merchant && !jwtPayload.mobileUpload) {
            this.logger.warn("Unauthorized access attempted to connect to the socket")
            client.disconnect()
            throw new WsException("Unauthorized access")
        }
        if (!jwtPayload.mobileUpload) {
            context.switchToWs().getData()._merchant = merchant._id;
            context.switchToWs().getData()._account = merchant.accounts[0]._id
        }
        else {
            context.switchToWs().getData()._merchant = jwtPayload.merchantId;
            context.switchToWs().getData()._account = null
        }
        return true;
    }

}