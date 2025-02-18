import { Module } from '@nestjs/common';
import { EventsListenerService } from './events-listener/events-listener.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ApplicationGateway } from './gatway/application.gateway';
import { MerchantsModule } from 'src/merchants/merchants.module';
import { StatusController } from './status/status.controller';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MerchantsModule
  ],
  controllers:[StatusController],
  providers: [EventsListenerService, ApplicationGateway]
})
export class ApplicationModule { }
