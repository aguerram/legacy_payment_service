import { AuthService } from './../auth.service';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from './jwt.payload';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor( private readonly authService:AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET
        });
    }

    async validate(payload: JwtPayload): Promise<any> { 
        const account = await this.authService.getMerchantAccountByAccountId(payload.accountId)
        if (!account) {
            throw new UnauthorizedException();
        }
        return account;
    }
}