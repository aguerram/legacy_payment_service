import { ONBOARDING_STATUS } from 'src/shared/enums';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
  UnauthorizedException,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import {
  UserDto,
  UpdatePasswdDto,
  UpdateCompanyDto,
  UpdateProfileDto,
  UpdatePayoutDto,
  BriefInfoDto,
} from './merchant.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GetMerchant } from './merchant.decorator';
import { Merchant } from './merchant.interfaces';
import { TokenAuthGuard } from './guards/token.guard';
import { ApiResponse } from 'src/shared/helpers';
import { OwnerGuard } from 'src/auth/owner.guard';
import { API_PREFIX } from 'src/shared/constants';

@Controller(`${API_PREFIX}/merchants`)
export class MerchantsController {
  constructor(private readonly merchantService: MerchantsService) {}

  // update merchant company info
  @Get('/:id/brief')
  @UseGuards(JwtAuthGuard)
  async getBriefMerchantInfo(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
  ) {
    if (merchant._id == merchant_id) {
      let data = new BriefInfoDto();
      data.merchantId = merchant_id;
      data.legalName = merchant.organization.legalName;
      data.accountName = merchant.accounts[0].fullName; // connected account
      return new ApiResponse(0, data);
    } else {
      throw new UnauthorizedException();
    }
  }
  // update merchant company info
  @Put('/:id/company')
  @UseGuards(JwtAuthGuard)
  async updateMerchantCompanyInfo(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
    @Body() companyDto: UpdateCompanyDto,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.updateMerchantCompanyInfo(
        merchant_id,
        companyDto,
      );
    } else {
      throw new UnauthorizedException();
    }
  }

  // update merchant profile
  @Put('/:id/profile')
  @UseGuards(JwtAuthGuard)
  async updateMerchantProfile(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
    @Body(ValidationPipe) profileDto: UpdateProfileDto,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.updateMerchantProfile(
        merchant_id,
        profileDto,
      );
    } else {
      throw new UnauthorizedException();
    }
  }

  // update merchant payout
  @Put('/:id/payout')
  @UseGuards(JwtAuthGuard)
  async updateMerchantPayout(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
    @Body(ValidationPipe) payoutDto: UpdatePayoutDto,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.updateMerchantPayout(
        merchant_id,
        payoutDto,
      );
    } else {
      throw new UnauthorizedException();
    }
  }

  // update merchant onboarding
  @Put('/:id/onboarding')
  @UseGuards(JwtAuthGuard)
  async updateMerchantOnboarding(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.updateMerchantOnboarding(merchant_id);
    } else {
      throw new UnauthorizedException();
    }
  }

  // upload merchant onboarding qid doc form mobile
  @Post('/:id/onboarding/files/representative/mobile')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(TokenAuthGuard)
  async uploadQidDocumentsMobile(
    @Param('id') merchant_id: string,
    @UploadedFiles() files,
  ) {
    return await this.merchantService.uploadQidDocuments(
      merchant_id,
      files,
      true,
    );
  }

  // upload merchant onboarding qid doc
  @Post('/:id/onboarding/files/representative')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadQidDocument(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
    @UploadedFiles() files,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.uploadQidDocuments(merchant_id, files);
    } else {
      throw new UnauthorizedException();
    }
  }

  // upload merchant onboarding qid doc form mobile
  @Post('/:id/onboarding/files/organization/mobile')
  @UseGuards(TokenAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocsFromMobile(
    @Param('id') merchant_id: string,
    @UploadedFile() file,
  ) {
    return await this.merchantService.uploadCommercialDoc(
      merchant_id,
      file,
      true,
    );
  }

  // upload merchant onboarding qid doc
  @Post('/:id/onboarding/files/organization')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCommercialDoc(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
    @UploadedFile() file,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.uploadCommercialDoc(merchant_id, file);
    } else {
      throw new UnauthorizedException();
    }
  }

  //upload merchant bank statements
  @Post('/:id/onboarding/files/bank/mobile')
  @UseGuards(TokenAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadbankAccountStatementMobile(
    @Param('id') merchant_id: string,
    @UploadedFile() file,
  ) {
    return await this.merchantService.uploadbankAccountStatementDoc(
      merchant_id,
      file,
      true,
    );
  }
  @Post('/:id/onboarding/files/bank')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadbankAccountStatement(
    @Param('id') merchant_id: string,
    @GetMerchant() merchant: Merchant,
    @UploadedFile() file,
  ) {
    if (merchant._id != merchant_id) throw new UnauthorizedException();

    return await this.merchantService.uploadbankAccountStatementDoc(
      merchant_id,
      file,
    );
  }
  @Post('/:id/onboarding/files/card')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadComputerCard(
    @GetMerchant() merchant: Merchant,
    @UploadedFile() file,
  ) {
    return await this.merchantService.uploadComputerCardDocument(
      merchant._id,
      file,
    );
  }

  @Post('/:id/onboarding/files/card/mobile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async UploadCimputerCardMobile(
    @GetMerchant() merchant: Merchant,
    @UploadedFile() file,
  ) {
    return await this.merchantService.uploadComputerCardDocument(
      merchant._id,
      file,
      true,
    );
  }
  //----------------
  //Upload merchant other documents
  @Post('/:id/onboarding/files/other/mobile')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(TokenAuthGuard)
  async uploadOtherDocuemtnsMobile(
    @Param('id') merchant_id: string,
    @UploadedFiles() files,
  ) {
    return await this.merchantService.uploadOtherDocuments(
      merchant_id,
      files,
      true,
    );
  }

  // upload merchant onboarding qid doc
  @Post('/:id/onboarding/files/other')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async uploadOtherDocuemtns(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
    @UploadedFiles() files,
  ) {
    if (merchant._id == merchant_id) {
      return await this.merchantService.uploadOtherDocuments(
        merchant_id,
        files,
      );
    } else {
      throw new UnauthorizedException();
    }
  }

  //-------------

  // upload merchant onboarding generate token
  @Get('/:id/onboarding/files/mobile/generate_token')
  async uploadDocsFromMobileGenerateToken(
    @Param('id') merchant_id: string,
    @Query() query: any,
  ) {
    return await this.merchantService.uploadDocsFromMobileGenerateToken(
      merchant_id,
      query,
    );
  }

  // upload merchant onboarding docs form mobile verify token
  @Get('/:id/onboarding/files/mobile/verify_token')
  @UseGuards(TokenAuthGuard)
  async uploadDocsFromMobileVerifyToken(
    @Param('id') merchant_id: string,
    @GetMerchant() merchant: Merchant,
  ) {
    if (merchant_id == merchant._id) {
      return new ApiResponse(0, { token_valid: true });
    } else {
      return new UnauthorizedException();
    }
  }

  // verify account
  // @Post('/signup/confirm')
  // async verifyAccount(@Body('token') token: string) {
  //   return await this.merchantService.verifyAccount(token);
  // }

  // resend email new account
  // @Post('/signup/resend')
  // async resendEmail(@Body('email') email: string) {
  //   return await this.merchantService.resendEmailSignup(email);
  // }

  // create new account
  // @Post('/signup')
  // async register(@Body(ValidationPipe) userDto: UserDto) {
  //   return await this.merchantService.register(userDto);
  // }

  // set new passowrd
  @Post('/reset/use')
  async resetPassword(@Body(ValidationPipe) updateDto: UpdatePasswdDto) {
    return await this.merchantService.resetPassword(updateDto);
  }

  // reset passswd check token
  @Post('/reset/check')
  async resetPasswdCheck(@Body('token') token: string) {
    return await this.merchantService.resetPasswdCheck(token);
  }

  // resend email reset
  @Post('/reset/resend')
  async resendResetEmail(@Body('email') email: string) {
    return await this.merchantService.forgotPassowrd(email);
  }

  // reset the password
  @Post('/reset')
  async forgotPassowrd(@Body('email') email: string) {
    return await this.merchantService.forgotPassowrd(email);
  }

  @Get('/info/:id')
  @UseGuards(JwtAuthGuard, new OwnerGuard('id'))
  async getMerchantImportantInformation(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
  ) {
    const merchant_account_id = merchant.accounts[0]._id;
    return await this.merchantService.getMerchantImportantInfo(
      merchant_id,
      merchant_account_id,
    );
  }

  @Get('/testmode')
  @UseGuards(JwtAuthGuard)
  async toggleTestMode(@GetMerchant() merchant: Merchant) {
    if (merchant?.onboarding?.status !== ONBOARDING_STATUS.COMPLETED) {
      throw new UnauthorizedException();
    } else {
      return await this.merchantService.toggleTestMode(merchant._id);
    }
  }

  // get merchant data
  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async getMerchantData(
    @GetMerchant() merchant: Merchant,
    @Param('id') merchant_id: string,
  ) {
    if (merchant._id == merchant_id) {
      // for sure there will be only one account because we sign the jwt token with only one account
      const merchant_account_id = merchant.accounts[0]._id;
      return await this.merchantService.getMerchantInfo(
        merchant_id,
        merchant_account_id,
      );
    } else {
      throw new UnauthorizedException();
    }
  }
}
