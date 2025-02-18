import { Body, Controller, Get, HttpCode, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UnnamedGuard } from './unnamed.guard';
import { UnnamedService } from './unnamed.service';

@Controller('unnamed')
@UseGuards(UnnamedGuard)
export class UnnamedController {

    constructor(
        private readonly unnamedService: UnnamedService
    ) { }

    @Post("/test/:merchant")
    async processWebhookPaymentTestMode(@Body() mpgs_response:any,@Param("merchant") merchant:string,@Res() res){
        return await this.unnamedService.processWebhookPayment(merchant,mpgs_response,true,res);
    }
    @Post("/:merchant")
    async processWebhookPayment(@Body() mpgs_response:any,@Param("merchant") merchant:string,@Req() req:any,@Res() res){
        return await this.unnamedService.processWebhookPayment(merchant,mpgs_response,req.testMode,res);
    }
}
