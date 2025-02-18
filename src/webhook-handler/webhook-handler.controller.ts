import { Param, Req, UseGuards } from '@nestjs/common';
import { Body, Controller, HttpStatus, HttpCode } from '@nestjs/common';
import { WebhookHandlerService } from './webhook-handler.service';
import { Request } from 'express';
import { Post } from '@nestjs/common';
import { WebhookHandlerGuard } from './webhook-handler.guard';
@Controller('webhook')
@UseGuards(WebhookHandlerGuard)
export class WebhookHandlerController {
  constructor(private readonly webhookService: WebhookHandlerService) {}
  @Post('/payment/:merchantUID')
  @HttpCode(HttpStatus.ACCEPTED)
  async handlePaymentWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Param('merchantUID') merchantUID: string,
  ) {
    return await this.webhookService.handlePaymentWebhook(
      req,
      merchantUID,
      body,
    );
  }
}
