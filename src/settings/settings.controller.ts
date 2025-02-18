import {
  Body,
  Post,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import {
  Controller,
  Get,
  Param,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { DeveloperService } from 'src/developer/developer.service';
import { GetMerchant } from 'src/merchants/merchant.decorator';
import { Merchant } from 'src/merchants/merchant.interfaces';
import {
  GeneralSettingsDTO,
  PayoutSettingsDTO,
  ResetKeysDto,
} from './settings.dto';
import { SettingsService } from './settings.service';
import { API_PREFIX } from 'src/shared/constants';
import { SettingsDAO } from 'src/merchants/settings.dao';
import { UpdatePaymentMethodDTO } from 'src/merchants/merchant.dto';

@Controller(`${API_PREFIX}/settings`)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly developerService: DeveloperService,
    private readonly settingsDao: SettingsDAO,
  ) {}

  @Get('/general')
  @UseGuards(JwtAuthGuard)
  async getGeneralSettings(
    @GetMerchant() merchant: Merchant,
  ) {
      return await this.settingsService.getMerchantGeneralSettings(merchant);
  }

  @Put('/general')
  @UseGuards(JwtAuthGuard)
  async saveGeneralSettings(
    @GetMerchant() merchant: Merchant,
    @Body(ValidationPipe) body: GeneralSettingsDTO,
  ) {
      return await this.settingsService.saveMerchantGeneralSettings(
        merchant,
        body,
      );
    
  }

  @Get(':id/payout')
  @UseGuards(JwtAuthGuard)
  async getPayoutSettings(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
  ) {
    if (merchant._id == merchant_id) {
      return await this.settingsService.getPayoutSettings(merchant_id);
    }
    throw new UnauthorizedException();
  }

  // @Put(':id/payout')
  // @UseGuards(JwtAuthGuard)
  // async updatePayoutSettings(
  //   @GetMerchant() merchant: Merchant,
  //   @Param('id') merchant_id: string,
  //   @Body() body: PayoutSettingsDTO,
  // ) {
  //   if (merchant._id == merchant_id) {
  //     return await this.settingsService.updatePayoutSettings(merchant, body);
  //   }
  //   throw new UnauthorizedException();
  // }

  @Post(':id/verification')
  @UseGuards(JwtAuthGuard)
  async resendVerificationEmail(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
  ) {
    if (merchant._id == merchant_id) {
      return await this.settingsService.resendVerificationEmail(merchant);
    }
    throw new UnauthorizedException();
  }

  @Post('verification/save/:token')
  async verifyEmailChange(@Param('token') token: string) {
    return this.settingsService.verifyEmailChange(token);
  }

  //updateColor 
  @Put(':id/checkout-color/:color') 
  @UseGuards(JwtAuthGuard)
  async updateCheckoutButtonColor(
    @Param('id') merchant_id: string,
    @Param('color') color: string,
    @GetMerchant() merchant: Merchant
  ) {
    if (merchant._id == merchant_id) {
      return this.settingsService.updateCheckoutButtonColor(merchant_id, color);
    }
    throw new UnauthorizedException();
  }
//get checkoutButtonColor
  @Get(':id/checkout-color') 
  @UseGuards(JwtAuthGuard)
  async getCheckoutButtonColor(
    @Param('id') merchant_id: string,
    @GetMerchant() merchant: Merchant
  ) {
    if (merchant._id == merchant_id) {
      return await this.settingsService.getCheckoutButtonColor(merchant_id);
    }
    throw new UnauthorizedException();
  }

  //upload logo
  @Post(':id/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async logoSave(
    @Param('id') merchant_id: string,
    @GetMerchant() merchant: Merchant,
    @UploadedFile() file,
  ) {
    if (merchant._id == merchant_id) {
      return await this.settingsService.saveLogo(merchant._id, file);
    }
    throw new UnauthorizedException();
  }

  @Get(':id/logo')
  @UseGuards(JwtAuthGuard)
  async getLogo(
    @Param('id') merchant_id: string,
    @GetMerchant() merchant: Merchant,
  ) {
    if (merchant._id == merchant_id) {
      return await this.settingsService.getLogo(merchant._id);
    }
    throw new UnauthorizedException();
  }

  //developer keys

  @Get('/api-keys')
  @UseGuards(JwtAuthGuard)
  async getDeveloperInfo(
    @GetMerchant() merchant: Merchant,
  ) {
    return this.developerService.getDeveloperInfo(merchant);
  }


  @Get('/payment-methods')
  @UseGuards(JwtAuthGuard)
  async getPaymentMethodsStatus(
    @GetMerchant() merchant: Merchant,
  ) {
    return this.settingsDao.getMerchantActiveMethods(merchant.uid,merchant);
  }

  @Put('/payment-methods')
  @UseGuards(JwtAuthGuard)
  async updatePaymentMethods(
    @GetMerchant() merchant: Merchant,
    @Body() data:UpdatePaymentMethodDTO
  ) {
    return this.settingsDao.updatePaymentMethods(merchant,data);
  }

  @Put('/api-keys/reset')
  @UseGuards(JwtAuthGuard)
  async resetDeveloperInfo(
    @GetMerchant() merchant: Merchant,
    @Body() resetDto:ResetKeysDto
  ) {
    return this.developerService.resetDeveloperInfo(merchant,resetDto.reset_type);
  }
}
