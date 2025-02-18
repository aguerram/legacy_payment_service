import {  Controller, Param, Post, UseGuards, Body, Get } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { refundEmailDTO, settlementEmailDTO } from './admin.dto';

@Controller('intranet')
export class AdminController {

    constructor(
        private readonly adminService: AdminService
    ) {}

    @Post("/merchants/:uid/approve")
    @UseGuards(AdminGuard)
    async approveMerchant(
        @Param("uid") uid: string
    ) {
        return this.adminService.approveMerchant(uid)
    }

    @Post("/merchants/:uid/suspend")
    @UseGuards(AdminGuard)
    async suspendMerchant(
        @Param("uid") uid: string
    ) {
        return this.adminService.suspendMerchant(uid)
    }

    @Post("/merchants/:uid/:AccountID/activate")
    @UseGuards(AdminGuard)
    async activateMerchantAccount(
        @Param("uid") uid: string,
        @Param("AccountID") AccountID: string,
    ) {
        return this.adminService.activateMerchantAccount(uid,AccountID)
    }

    @Post("/merchants/:uid/:AccountID/deactivate")
    @UseGuards(AdminGuard)
    async deactivateMerchantAccount(
        @Param("uid") uid: string,
        @Param("AccountID") AccountID: string,
    ) {
        return this.adminService.deactivateMerchantAccount(uid,AccountID)
    }

    @Post("/merchants/:uid/emailRefund")
    @UseGuards(AdminGuard)
    async emailRefund(
        @Param("uid") uid: string,
        @Body() refundDTO: refundEmailDTO,
    ) {
        return this.adminService.emailRefund(uid,refundDTO)
    }

    @Post("/merchants/:uid/emailSettlement")
    @UseGuards(AdminGuard)
    async sendSettlementEmail(
        @Param("uid") uid: string,
        @Body() settlementDTO: settlementEmailDTO,
    ) {
        return this.adminService.emailSettlement(uid,settlementDTO)
    }



    
      //! this is private to be removed after
    @Get("/merchants/generate-apis")
    @UseGuards(AdminGuard)
    async generateApiKeys(
    ) {
        return this.adminService.generateKeys()
    }
}
