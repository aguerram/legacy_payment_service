import { MailingModule } from './../mailing/mailing.module';
import { Module } from '@nestjs/common';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DeveloperModule } from 'src/developer/developer.module';

@Module({
  imports: [
    MerchantsModule,
    MailingModule,
    DeveloperModule,
  ],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule { }
