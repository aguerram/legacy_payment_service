import { JwtPayload } from './../auth/jwt/jwt.payload';
import { AuthService } from './../auth/auth.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  UserDto,
  UpdatePasswdDto,
  UpdateCompanyDto,
  UpdateProfileDto,
  UpdatePayoutDto,
} from './merchant.dto';
import { DB_MERCHANT } from 'src/shared/constants';
import { InjectModel } from '@nestjs/mongoose';
import { Merchant } from './merchant.interfaces';
import { Model } from 'mongoose';
import {
  ApiResponse,
  generateToken,
  decryptAES,
  generateMerchantUID,
} from 'src/shared/helpers';
import { MailingService } from 'src/mailing/mailing.service';
import { MERCHANT_ACCOUNT_STATUS, ONBOARDING_STATUS } from 'src/shared/enums';
import { FilesService } from 'src/files/files.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MobileDocumentsUploadedEvent } from 'src/application/events-listener/events.interface';
import { EventsTypes } from 'src/application/events-listener/events.enum';
import { CachingService } from 'src/caching/caching.service';
import { QrCode, Types, Ecl } from '@primecode/async-qrcode';
import { getCustomerPaidOrderHtml } from 'src/shared/html_mail_templates';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { EmailEvent } from 'src/mailing/events/email.events';
import { EmailEventTypes } from 'src/mailing/events/event-types';
import { SettingsDAO } from './settings.dao';

@Injectable()
export class MerchantsService {
  private logger: Logger = new Logger(MerchantsService.name);

  constructor(
    @InjectModel(DB_MERCHANT) private merchantModel: Model<Merchant>,
    private readonly mailingService: MailingService,
    private readonly filesService: FilesService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CachingService,
    private readonly authService: AuthService,
    private readonly developerDao: DeveloperDAO,
    private readonly settingsDAO: SettingsDAO,
  ) {}

  // async getMerchantActiveMethods(uid: string) {
  //   const active = await this.settingsDAO.getMerchantActiveMethods(uid);
  //   if (!active) {
  //     throw new NotFoundException();
  //   }
  //   return active;
  // }

  async findMerchantByUID(uid: string) {
    return await this.merchantModel.findOne({ uid });
  }

  async getMerchantByAccountEmail(email: string): Promise<Merchant> {
    const merchant = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            email,
          },
        },
      },
      {
        accounts: {
          $elemMatch: {
            email,
          },
        },
      },
    );
    return merchant;
  }

  async getMerchantByAccountToken(token: string): Promise<Merchant> {
    const merchant = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            token,
          },
        },
      },
      {
        accounts: {
          $elemMatch: {
            token,
          },
        },
      },
    );
    return merchant;
  }

  async getMerchantByAccountID(accountId: string): Promise<Merchant> {
    const merchant = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            _id: accountId,
          },
        },
      },
      {
        accounts: {
          $elemMatch: {
            _id: accountId,
          },
        },
      },
    );
    return merchant;
  }

  // for token jwt verification verification
  async getMerchantById(merchant_id: string): Promise<Merchant> {
    const merchant = await this.merchantModel.findOne({ _id: merchant_id });
    return merchant;
  }

  async getMerchantInfo(merchant_id, merchant_account_id) {
    let merchant = await this.merchantModel.findOne(
      {
        _id: merchant_id,
        accounts: {
          $elemMatch: {
            _id: merchant_account_id,
          },
        },
      },
      {
        uid: 1,
        status: 1,
        profile: 1,
        agreementSigned: 1,
        lastLogin: 1,
        organization: 1,
        representative: 1,
        onboarding: 1,
        payout: 1,
        accounts: {
          $elemMatch: {
            _id: merchant_account_id,
          },
        },
      },
    );

    return new ApiResponse(0, { merchant });
  }

  async getMerchantImportantInfo(merchant_id, merchant_account_id) {
    let merchant = await this.merchantModel.findOne(
      {
        _id: merchant_id,
        accounts: {
          $elemMatch: {
            _id: merchant_account_id,
          },
        },
      },
      {
        uid: 1,
        lastLogin: 1,
        organization: 1,
        onboarding: 1,
        testMode: 1,
        accounts: {
          $elemMatch: {
            _id: merchant_account_id,
          },
        },
      },
    );

    // check onboarding status
    const status = this.checkOnboardingStatus(merchant.onboarding);
    if (status !== merchant.onboarding.status) {
      merchant.onboarding.status = status;
      await merchant.save();
    }

    return new ApiResponse(0, { merchant });
  }

  // check onboarding status
  private checkOnboardingStatus = (onboarding) => {
    if (onboarding?.status === ONBOARDING_STATUS.COMPLETED) {
      return ONBOARDING_STATUS.COMPLETED;
    }
    return onboarding?.orgCommercialRegistrationDoc?.path &&
      onboarding?.bankAccountStatement?.path &&
      onboarding?.qidDoc?.length > 0
      ? ONBOARDING_STATUS.IN_REVIEW
      : ONBOARDING_STATUS.NEEDS_DATA;
  };

  async register(userDto: UserDto) {
    // generate the uid unqiue
    let uid = null;
    while (uid == null) {
      let _uid = generateMerchantUID();
      let merchant = await this.findMerchantByUID(_uid);
      if (!merchant) {
        uid = _uid;
      }
    }
    let token = generateToken(32);
    userDto.password = decryptAES(userDto.password);
    const settings = await this.settingsDAO.createMerchantSettings();
    let merchant = {
      accounts: [{ ...userDto, token }],
      uid,
      lastLogin: new Date(),
      settings: settings,
    };
    const createdUser = new this.merchantModel(merchant);
    try {
      const created = await createdUser.save();

      // generate api keys for the merchant
      if (created) {
        try {
          // generate keys for test
          await this.developerDao.createNewKeys(created?.uid, true);
        } catch (error) {
          console.log('Error while generating the APIs');
        }
      }

      // send verification email
      const { email, fullName } = userDto;
      // emit signup email event
      const emailEvent = new EmailEvent();
      emailEvent.email = email;
      emailEvent.fullName = fullName;
      emailEvent.subject = `Hi ${fullName}, we need you to confirm your email`;
      emailEvent.url = process.env.FRONT_URL + '/confirm/' + token;
      emailEvent.templateName = 'email-confirmation';
      this.eventEmitter.emit(EmailEventTypes.CONFIRM_EMAIL, emailEvent);

      return new ApiResponse(1008);
    } catch (error) {
      if (error.code === 11000) {
        return new ApiResponse(1010, null, false);
      } else {
        return new ApiResponse(1011, null, false);
      }
    }
  }

  async resendEmailSignup(email) {
    try {
      let merchant = await this.getMerchantByAccountEmail(email);
      let newToken = generateToken(32);
      merchant.accounts[0].token = newToken;
      await merchant.save();
      let { token, fullName } = merchant.accounts[0];

      // emit signup email event
      const emailEvent = new EmailEvent();
      emailEvent.email = email;
      emailEvent.fullName = fullName;
      emailEvent.subject = `Hi ${fullName}, we need you to confirm your email`;
      emailEvent.url = process.env.FRONT_URL + '/confirm/' + token;
      emailEvent.templateName = 'email-confirmation';
      this.eventEmitter.emit(EmailEventTypes.CONFIRM_EMAIL, emailEvent);
    
      return new ApiResponse(1012);
    } catch (error) {
      return new ApiResponse(1014, null, false);
    }
  }

  async verifyAccount(token: string) {
    try {
      let merchant = await this.getMerchantByAccountToken(token);
      const _merchant = await this.merchantModel.findOne({ _id: merchant._id });
      const index = _merchant.accounts.findIndex(
        (el) => String(el.token) === String(token),
      );
      if (merchant && _merchant) {
        // check  if the account already verified
        if (
          _merchant.accounts[index].status === MERCHANT_ACCOUNT_STATUS.ACTIVE
        ) {
          return new ApiResponse(1015, null, false);
        } else {
          _merchant.accounts[index].status = MERCHANT_ACCOUNT_STATUS.ACTIVE;
          await _merchant.save();
          let { email, fullName } = _merchant.accounts[index];

          // emit welcome email event
          const emailEvent = new EmailEvent();
          emailEvent.email = email;
          emailEvent.fullName = fullName;
          emailEvent.subject = `Hi ${fullName} - Welcome to Dibsy!`;
          emailEvent.url = process.env.FRONT_URL;
          emailEvent.templateName = 'weclome-email';
          this.eventEmitter.emit(EmailEventTypes.WELCOME, emailEvent);

          let payload: JwtPayload = {
            accountId: merchant.accounts[index]._id,
            merchantId: merchant._id,
          };
          return await this.authService.login(payload);
          //return new ApiResponse(1016);
        }
      } else {
        return new ApiResponse(1017, null, false);
      }
    } catch (error) {
      return new ApiResponse(1018, null, false);
    }
  }

  async forgotPassowrd(email: string) {
    const merchant = await this.getMerchantByAccountEmail(email);
    try {
      if (merchant) {
        // for sure it will return only one account
        let account = merchant.accounts[0];
        let newToken = generateToken(32);
        account.token = newToken;
        await this.merchantModel
          .findOneAndUpdate(
            {
              _id: merchant._id,
              accounts: { $elemMatch: { email: account.email } },
            },
            {
              $set: { 'accounts.$.token': newToken },
            },
            { useFindAndModify: false },
          )
          .exec();
        const { email, fullName } = account;
        let url = process.env.FRONT_URL + '/reset/' + newToken;

        // emit reset password email event
        const emailEvent = new EmailEvent();
        emailEvent.email = email;
        emailEvent.fullName = fullName;
        emailEvent.subject = `Reset Your Dibsy Password`;
        emailEvent.url = url;
        emailEvent.templateName = 'reset-password';
        this.eventEmitter.emit(EmailEventTypes.RESET_PASSWORD, emailEvent);
        return new ApiResponse(1019);
      } else {
        return new ApiResponse(1021, null, false);
      }
    } catch (error) {
      return new ApiResponse(1022, null, false);
    }
  }

  async resetPasswdCheck(token: string) {
    const merchant = await this.getMerchantByAccountToken(token);

    if (merchant) return new ApiResponse(0, null, true);

    return new ApiResponse(0, null, false);
  }

  async resetPassword(updatePasswd: UpdatePasswdDto) {
    const merchant = await this.getMerchantByAccountToken(updatePasswd.token);
    const _merchant = await this.merchantModel.findOne({ _id: merchant._id });
    const index = _merchant.accounts.findIndex(
      (el) => String(el.token) === String(updatePasswd.token),
    );

    try {
      if (_merchant && merchant) {
        _merchant.accounts[index].password = decryptAES(updatePasswd.password);
        _merchant.accounts[index].token = generateToken(32);
        await _merchant.save();

        const { email, fullName } = merchant?.accounts[0];
        // emit password changed email event
        const emailEvent = new EmailEvent();
        emailEvent.email = email;
        emailEvent.fullName = fullName;
        emailEvent.subject = `Hi ${fullName}, Your Password Has Been Changed`;
        emailEvent.templateName = 'password-changed';
        this.eventEmitter.emit(EmailEventTypes.PASSWORD_CHANGED, emailEvent);
        let payload: JwtPayload = {
          accountId: merchant.accounts[0]._id,
          merchantId: merchant._id,
        };
        return await this.authService.login(payload);
      } else {
        return new ApiResponse(1004, {}, false);
      }
    } catch (error) {
      return new ApiResponse(1005, {}, false);
    }
  }

  async updateMerchantCompanyInfo(
    merchant_id: string,
    companyDto: UpdateCompanyDto,
  ) {
    try {
      const merchant = await this.merchantModel.findOne({ _id: merchant_id });
      merchant.representative = companyDto.representative;
      merchant.organization = companyDto.organization;
      await merchant.save();
      return new ApiResponse(1006);
    } catch (error) {
      return new ApiResponse(1007, null, false);
    }
  }

  async updateMerchantProfile(
    merchant_id: string,
    profileDto: UpdateProfileDto,
  ) {
    try {
      const merchant = await this.merchantModel.findOne({ _id: merchant_id });
      merchant.profile = profileDto;
      await merchant.save();
      return new ApiResponse(1023);
    } catch (error) {
      return new ApiResponse(1024, null, false);
    }
  }

  async updateMerchantPayout(merchant_id: string, payoutDto: UpdatePayoutDto) {
    try {
      const merchant = await this.merchantModel.findOne({ _id: merchant_id });
      merchant.payout = payoutDto;
      await merchant.save();
      return new ApiResponse(1025);
    } catch (error) {
      return new ApiResponse(1026, null, false);
    }
  }

  async updateMerchantOnboarding(merchant_id: string) {
    try {
      const merchant = await this.merchantModel.findOne({ _id: merchant_id });
      merchant.onboarding.submittedAt = new Date();
      merchant.onboarding.status = ONBOARDING_STATUS.IN_REVIEW;
      await merchant.save();
      return new ApiResponse(1027);
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1028, null, false);
    }
  }

  async uploadCommercialDoc(merchant_id: string, file, fromMobile = false) {
    try {
      const merchant: Merchant = await this.merchantModel.findOne({
        _id: merchant_id,
      });
      // save file in s3 then save the path
      let fileAdded = await this.filesService.uploadPublicFile(
        file,
        merchant?.uid,
      );
      merchant.onboarding.orgCommercialRegistrationDoc = {
        path: fileAdded.Location,
        key: fileAdded.Key,
      };

      await merchant.save();

      // this.eventEmitter.emit(
      //  EventsTypes.MOBILE_DOCUMENTS_UPLOADED,
      //   new MobileDocumentsUploadedEvent(merch, fromMobile),
      // );

      return new ApiResponse(1032);
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1029, null, false);
    }
  }
  async uploadbankAccountStatementDoc(
    merchant_id: string,
    file,
    fromMobile = false,
  ) {
    try {
      const merchant: Merchant = await this.merchantModel.findOne({
        _id: merchant_id,
      });
      // save file in s3 then save the path
      let fileAdded = await this.filesService.uploadPublicFile(
        file,
        merchant?.uid,
      );
      merchant.onboarding.bankAccountStatement = {
        path: fileAdded.Location,
        key: fileAdded.Key,
      };

      await merchant.save();
      // this.eventEmitter.emit(
      //   EventsTypes.MOBILE_DOCUMENTS_UPLOADED,
      //   new MobileDocumentsUploadedEvent(merch, fromMobile),
      // );

      return new ApiResponse(1032);
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1029, null, false);
    }
  }

  async uploadComputerCardDocument(
    merchant_id: string,
    file,
    fromMobile = false,
  ) {
    try {
      const merchant: Merchant = await this.merchantModel.findOne({
        _id: merchant_id,
      });
      // save file in s3 then save the path
      let fileAdded = await this.filesService.uploadPublicFile(
        file,
        merchant?.uid,
      );
      merchant.onboarding.orgComputerCardDoc = {
        path: fileAdded.Location,
        key: fileAdded.Key,
      };

      await merchant.save();
      return new ApiResponse(1032);
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1029, null, false);
    }
  }

  async uploadQidDocuments(
    merchant_id: string,
    files: [any],
    fromMobile = false,
  ) {
    try {
      const merchant = await this.merchantModel.findOne({ _id: merchant_id });
      merchant.onboarding.qidDoc = [];
      for (let file of files) {
        let fileAdded = await this.filesService.uploadPublicFile(
          file,
          merchant?.uid,
        );
        merchant.onboarding.qidDoc.push({
          key: fileAdded.Key,
          path: fileAdded.Location,
        });
      }

      await merchant.save();

      return new ApiResponse(1032);
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1030, null, false);
    }
  }

  async uploadOtherDocuments(
    merchant_id: string,
    files: [any],
    fromMobile = false,
  ) {
    try {
      const merchant = await this.merchantModel.findOne({ _id: merchant_id });
      merchant.onboarding.otherDoc = [];
      for (let file of files) {
        let fileAdded = await this.filesService.uploadPublicFile(
          file,
          merchant?.uid,
        );
        merchant.onboarding.otherDoc.push({
          key: fileAdded.Key,
          path: fileAdded.Location,
        });
      }

      const merch = await merchant.save();
      this.eventEmitter.emit(
        EventsTypes.MOBILE_DOCUMENTS_UPLOADED,
        new MobileDocumentsUploadedEvent(merch, fromMobile),
      );
      return new ApiResponse(1032);
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1030, null, false);
    }
  }

  async uploadDocsFromMobileGenerateToken(merchant_id: string, body: any) {
    if (!body.qrLink) throw new BadRequestException();

    try {
      let merchant = await this.merchantModel.findOne({ _id: merchant_id });
      const token = await this.jwtService.sign(
        { merchantId: merchant._id, mobileUpload: true },
        {
          expiresIn: '1h',
        },
      );

      this.cacheService.cache.set(merchant_id, token, {
        ttl: 3600, //1h
      });

      const link = `${body.qrLink}?token=${token}&_uid=${merchant_id}`;

      const generatedQr = await QrCode.generate({
        data: link,
        ecl: Ecl.QUARTILE,
        type: Types.SQUARE,
        color: '#000',
        background: '#fff',
      });
      return new ApiResponse(0, { token, generatedQr, link });
    } catch (error) {
      this.logger.error(error);
      return new ApiResponse(1031, null, false);
    }
  }

  // togggle test mode for merchant
  async toggleTestMode(merchantId) {
    let merchant = await this.merchantModel.findOne({ _id: merchantId });
    try {
      merchant.testMode = !merchant.testMode;
      await merchant.save();
      return new ApiResponse(0, { testMode: merchant.testMode });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async updateMerchantAccountStatus(
    uid,
    accountId,
    status: MERCHANT_ACCOUNT_STATUS,
  ) {
    try {
      const updateMerchant = await this.merchantModel
        .findOneAndUpdate(
          {
            uid,
            accounts: { $elemMatch: { _id: accountId } },
          },
          {
            $set: { 'accounts.$.status': status },
          },
          { useFindAndModify: false },
        )
        .exec();

      if (!updateMerchant) throw new NotFoundException();
      return true;
    } catch (err) {
      return null;
    }
  }

  async testMail() {
    try {
      // let res = await this.mailingService.sendMessage(
      //   'osidi1998@gmail.com',
      //   'test user to',
      //   'test',
      //   getRefundApprovedHtml(3000,400,"QAR",new Date().getTime(),new Date().getTime(),'visa',"••• •••• •••• 4656","test")
      // );

      // let subject = `Purchase Confirmation`;
      // const res =await this.mailingService.sendMessage(
      //   "osidi1998@gmail.com",
      //   "med",
      //   subject,
      //   getPurchaseConfirmationHtml(
      //    "Rose And Rose Trading",
      //    "mail@mail.com",
      //     "ord_343445",
      //     4000,
      //    "QAR",
      //     format_date_only(new Date().getTime()),
      //     "2121 2121 2121 2121",
      //     "visa",
      //    null,
      //     "test",
      //     false
      //   ),
      // );

      let subject = `Payment of 566 QAR - ord_34fg5`;
      const res = await this.mailingService.sendMessage(
        'osidi1998@gmail.com',
        'med',
        subject,
        getCustomerPaidOrderHtml(
          400,
          45,
          'QAR',
          'ord_34fg5',
          new Date().getTime(),
          'visa',
          '2121 2121 2121 2121',
          'med',
          'wepup llc',
          true,
        ),
      );

      return new ApiResponse(0, res);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
