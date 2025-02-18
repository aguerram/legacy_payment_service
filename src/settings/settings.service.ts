import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { DB_MERCHANT } from 'src/shared/constants';
import { ApiResponse, generateToken } from 'src/shared/helpers';
import { pick } from 'lodash';
import { GeneralSettingsDTO, PayoutSettingsDTO } from './settings.dto';
import { Account } from 'src/merchants/merchant.interfaces';
import * as bcrypt from 'bcrypt';
import { UpdatePayoutDto } from 'src/merchants/merchant.dto';
import { FilesService } from 'src/files/files.service';
import { MailingService } from 'src/mailing/mailing.service';
import {
  sendEmailChangedVerification,
  sendNotificationOfMailChanged,
} from 'src/shared/html_mail_templates';
import { MerchantsService } from 'src/merchants/merchants.service';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(DB_MERCHANT) private readonly merchantModel: Model<Merchant>,
    private readonly filesService: FilesService,
    private readonly mailingService: MailingService,
    private readonly merchantService: MerchantsService,
  ) {}
  async getMerchantGeneralSettings(merchant: any) {
    return new ApiResponse(
      null,
      pick(merchant.accounts[0], [
        'fullName',
        'email',
        'phone',
        'pendingEmail',
      ]),
    );
  }


  async getPaymentMethodsStatus( merchant: Merchant,){
    return new ApiResponse(
      null,
      pick(merchant.accounts[0], [
        'fullName',
        'email',
        'phone',
        'pendingEmail',
      ]),
    );
  }

  async saveMerchantGeneralSettings(
    merchant: Merchant,
    body: GeneralSettingsDTO,
  ) {
    const data = await this.merchantModel.findOne({ _id: merchant._id });
    const emailExists = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            email: body.email,
          },
        },
      },
      {
        accounts: {
          $elemMatch: {
            email: body.email,
          },
        },
      },
    );

    const account = merchant.accounts[0];
    let emailChanged = false;
    let passwordChanged = false;

    //check password first
    if (!bcrypt.compareSync(body.current_password, account.password))
      throw new BadRequestException({
        current_password: 'Password incorrect',
      });

    if (emailExists && emailExists.accounts?.length > 0) {
      //check first if the email already taken
      if (String(emailExists.accounts[0]._id) !== String(account._id)) {
        throw new BadRequestException({
          email: 'Email already taken',
        });
      }
    }
    //check if the sent email equals to user's email
    if (!account.pendingEmail && account.email !== body.email) {
      emailChanged = true;
    }

    if (
      (emailChanged && !(body.current_password?.length > 0)) ||
      (body.new_password?.length > 0 && !(body.current_password?.length > 0))
    ) {
      throw new BadRequestException({
        current_password: 'Current password is required',
      });
    }
    if (body.current_password?.length > 0) {
      if (!bcrypt.compareSync(body.current_password, account.password))
        throw new BadRequestException({
          current_password: 'Password incorrect',
        });

      if (body.new_password?.length > 0) passwordChanged = true;
    }
    const index = data.accounts.findIndex(
      (el) => String(el._id) === String(account._id),
    );
    const accountToSave: Account = data.accounts[index];
    accountToSave.fullName = body.fullName;
    accountToSave.phone = body.phone;
    if (passwordChanged) {
      accountToSave.password = body.new_password;
    }

    if (emailChanged) {
      accountToSave.pendingEmail = body.email;

      const token = await this.loginEmailChangedNotification(
        accountToSave.fullName,
        accountToSave.email,
        accountToSave.pendingEmail,
      );

      accountToSave.token = token;
    }
    await data.save();
    return new ApiResponse(7000, {
      pendingEmail: accountToSave.pendingEmail,
    });
  }

  async getPayoutSettings(merchant_id: string) {
    const data = await this.merchantModel.findById({ _id: merchant_id });
    return new ApiResponse(null, data.payout);
  }

  async updatePayoutSettings(merchant: Merchant, body: PayoutSettingsDTO) {
    const merchat = await this.merchantModel.findOne({ _id: merchant._id });
    const account = merchant.accounts[0];
    //check password first
    if (!bcrypt.compareSync(body.current_password, account.password))
      throw new BadRequestException({
        current_password: 'Password incorrect',
      });

    merchat.payout.IBAN = body.IBAN;
    merchat.payout.accountName = body.accountName;
    merchat.payout.bankName = body.bankName;
    await merchat.save();

    return new ApiResponse(7001);
  }

  async resendVerificationEmail(merchant: Merchant) {
    const account: Account = merchant.accounts[0];

    const data = await await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            _id: account._id,
          },
        },
      },
      {
        accounts: {
          $elemMatch: {
            _id: account._id,
          },
        },
      },
    );
    const accountToSave = data.accounts[0];

    if (!(accountToSave.pendingEmail?.length > 0)) {
      return new ApiResponse(7005);
    }

    const token = await this.loginEmailChangedNotification(
      accountToSave.fullName,
      accountToSave.email,
      accountToSave.pendingEmail,
      false,
    );
    accountToSave.token = token;
    await data.save();
    return new ApiResponse(7002);
  }

  async verifyEmailChange(token: string) {
    const merchant = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            token,
            pendingEmail: {
              $ne: null,
            },
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

    if (!merchant) {
      throw new NotFoundException();
    }
    const account = merchant.accounts[0];

    await this.merchantModel.updateOne(
      {
        'accounts._id': account.id,
      },
      {
        $set: {
          'accounts.$.email': account.pendingEmail,
          'accounts.$.pendingEmail': null,
          'accounts.$.token': null,
        },
      },
    );

    return new ApiResponse(7003);
  }

  //update checkoutButtonColor
  async updateCheckoutButtonColor(merchant_id: string, color: string) {
    const merchant = await this.merchantModel
      .findOne({ _id: merchant_id }).populate('settings')
    merchant.settings.checkout.buttonColor = `#${color}`;
    
    await merchant.settings.save();

    return new ApiResponse(7004);
  }

  async getCheckoutButtonColor(merchant_id: string) {
    const data = await this.merchantModel.findOne({ _id: merchant_id }).populate('settings');
    if (!data) throw new NotFoundException();

    return new ApiResponse(0, data.settings?.checkout?.buttonColor, true);
  }

  async saveLogo(merchant_id: string, file) {
    const merchant = await this.merchantModel
      .findOne({ _id: merchant_id })
      .populate('settings');
    let fileAdded = await this.filesService.uploadPublicFile(file, merchant_id);

    //delete old one first

    if (merchant.settings?.checkout?.logo?.key) {
      await this.filesService.deletePublicFile(
        merchant.settings?.checkout?.logo?.key,
      );
    }

    merchant.settings.checkout.logo = {
      path: fileAdded.Location,
      key: fileAdded.Key,
    };
    //Delete old logo
    await merchant.settings.save();
    return new ApiResponse(7004);
  }

  //send notification helper
  private async loginEmailChangedNotification(
    fullName: string,
    oldEmail: string,
    newEmail: string,
    notify = true,
  ): Promise<string> {
    const verificationToken = generateToken(32);
    const token = verificationToken;

    //send email changed notification

    let confirmationEmail;
    if (notify) {
      confirmationEmail = await this.mailingService.sendTemplate(
        oldEmail,
        fullName,
        'The email address of your Dibsy account has been changed',
        'mail-changed-notification',
        [],
        [
          {
            name: 'email',
            content: newEmail,
          },
          {
            name: 'name',
            content: fullName,
          },
        ],
      );
    }

    const url = `${process.env.FRONT_URL}/callback/verify/email_change/${verificationToken}`;
    const verificationEmail = await this.mailingService.sendTemplate(
      newEmail,
      fullName,
      'The email address of your Dibsy account has been changed',
      'email-changed-verification',
      [],
      [
        {
          name: 'url',
          content: url,
        },
        {
          name: 'name',
          content: fullName,
        },
      ],
    );

    if (
      (notify && confirmationEmail[0]?.status !== 'sent') ||
      verificationEmail[0].status !== 'sent'
    ) {
      throw new InternalServerErrorException(
        'There was en error while changning your email, please try again',
      );
    }
    return token;
  }

  async getLogo(merchantId: string) {
    const data = await this.merchantModel.findOne({ _id: merchantId }).populate('settings');
    if (!data) throw new NotFoundException();

    return new ApiResponse(0, {
      location: data.settings.checkout?.logo?.path
    }, true);
  }
}
