import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_MERCHANT } from 'src/shared/constants';
import { MerchantSchema } from 'src/merchants/schemas/merchant.schema';
import { MailingModule } from 'src/mailing/mailing.module';
import { FilesService } from 'src/files/files.service';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { DeveloperModule } from 'src/developer/developer.module';

@Module({
  imports: [
    MailingModule,
    MerchantsModule,
    MongooseModule.forFeature([
      {
        name: DB_MERCHANT,
        schema: MerchantSchema,
      },
    ]),
    DeveloperModule
  ],
  providers: [SettingsService, FilesService],
  controllers: [SettingsController],
})
export class SettingsModule { }
