import { GetMerchant } from 'src/merchants/merchant.decorator';
import { BalanceSettingsDto } from './balance.dto';
import { BalanceService } from './balance.service';
import { Controller, UseGuards, Get, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { API_PREFIX } from 'src/shared/constants';
import { Merchant } from 'src/merchants/merchant.interfaces';

@Controller(`${API_PREFIX}/settlements`)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}


  // get balance of a merchant with pagination
  @UseGuards(JwtAuthGuard)
  @Get('')
  async getMerchantBalances(
    @Query() settings: BalanceSettingsDto,
    @GetMerchant() merchant:Merchant,
  ) {
    return await this.balanceService.getMerchantBalances(settings, merchant._id);
  }

  // get balance of a merchant with pagination
  @UseGuards(JwtAuthGuard)
  @Get('/:uid')
  async getMerchantBalance(
    @Param('uid') uid: string,
    @GetMerchant() merchant: Merchant,
  ) {
    return await this.balanceService.getBalanceInfo(merchant._id, uid);
  }


  }
