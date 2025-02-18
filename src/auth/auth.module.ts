import { ConfigService, ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_MERCHANT } from 'src/shared/constants';
import { MerchantSchema } from 'src/merchants/schemas/merchant.schema';


@Global()
@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      {
        name: DB_MERCHANT,
        schema: MerchantSchema,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        signOptions: {
          expiresIn: 1 * 24 * 3600,
        },
        secret: configService.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule { }
