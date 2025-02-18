import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreatePaymentApplePayAPIDto } from 'src/api/v1/payments/payments.dto';
import { WebclientService } from 'src/webclient/webclient.service';

@Injectable()
export class PrivateCheckoutService {
  private logger: Logger = new Logger(PrivateCheckoutService.name);

  constructor(private readonly webClient: WebclientService) {}

  async proccessApplePayPaymentAPI(data: CreatePaymentApplePayAPIDto) {
    try {
      this.logger.log(
        `Start processing apple pay payment from api developer api`,
      );
      return  await this.webClient
        .getCheckoutCall()
        .post(`/private/payments/applepay`, data);
    } catch (error) {
      throw new BadRequestException(error?.response?.data?.message);
    }
  }
}
