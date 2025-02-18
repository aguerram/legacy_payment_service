import { Body, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CanActivateTestmodeGuard } from 'src/auth/can-activate-testmode.guard';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { OwnerGuard } from 'src/auth/owner.guard';
import { GetInsightsDTO } from './insights.dto';
import { InsightsService } from './insights.service';
import { API_PREFIX } from 'src/shared/constants';

@Controller(`${API_PREFIX}/insights`)
export class InsightsController {
    constructor(
        private readonly insightsService: InsightsService
    ) { }
    
    @Get(":id")
    @UseGuards(JwtAuthGuard, new OwnerGuard('id'), CanActivateTestmodeGuard)
    async getInsights(
        @Param("id") merchantID: string,
        @Query() query: GetInsightsDTO
    ) {
        return this.insightsService.getInsights(merchantID, query)
    }
}
