import { Module } from '@nestjs/common';
import { WebclientService } from 'src/webclient/webclient.service';
import { PrivateCheckoutService } from './private-checkout.service';

@Module({
  providers: [PrivateCheckoutService,WebclientService],
  exports: [PrivateCheckoutService],
})
export class PrivateCheckoutModule {}
