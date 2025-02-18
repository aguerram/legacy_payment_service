import { AuthModule } from './../auth/auth.module';
import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_MERCHANT, DB_DEVELOPER, DB_DEVELOPER_TEST, DB_SETTINGS } from './../shared/constants';
import { MerchantSchema } from './schemas/merchant.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { FilesModule } from 'src/files/files.module';
import { MailingModule } from 'src/mailing/mailing.module';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { DeveloperSchema } from 'src/developer/model/developer.schema';
import { MerchantDAO } from './merchants.dao';
import { EmailsEventListeners } from 'src/mailing/listeners/emails.listeners';
import { SettingsSchema } from './schemas/settings.schema';
import { SettingsDAO } from './settings.dao';

@Module({
  imports: [
    FilesModule,
    MailingModule,
    AuthModule,
    MongooseModule.forFeature([
      {
        name: DB_MERCHANT,
        schema: MerchantSchema,
      },
      {
        name: DB_DEVELOPER,
        schema: DeveloperSchema,
      },
      {
        name: DB_DEVELOPER_TEST,
        schema: DeveloperSchema,
      },
      {
        name:DB_SETTINGS,
        schema: SettingsSchema,
      }
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        signOptions: {
          expiresIn: 3600,
        },
        secret: configService.get("JWT_SECRET"),
      }),
      inject: [ConfigService],
    })
  ],
  controllers: [MerchantsController],
  providers: [MerchantsService,DeveloperDAO,MerchantDAO,EmailsEventListeners,SettingsDAO],
  exports: [MerchantsService,MerchantDAO,SettingsDAO],
})
//@ts-ignore
export class MerchantsModule { }
