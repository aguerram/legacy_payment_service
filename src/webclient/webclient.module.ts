import { Global, Module } from '@nestjs/common';
import { WebclientService } from './webclient.service';

@Global()
@Module({
  providers: [WebclientService],
  exports: [WebclientService]
})
export class WebclientModule { }
