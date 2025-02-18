import { DB_MERCHANT } from './../shared/constants';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './jwt/jwt.payload';
import { MERCHANT_ACCOUNT_STATUS, ONBOARDING_STATUS } from 'src/shared/enums';
import { ApiResponse, decryptAES } from 'src/shared/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Merchant } from 'src/merchants/merchant.interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(DB_MERCHANT) private merchantModel: Model<Merchant>,
    private readonly jwtService: JwtService,
  ) {}
  async validateUser(email: string, password: string) {
    const merchant = await this.getMerchantByAccountEmail(email);

    // check merchant exist
    if (merchant) {
      const account = merchant.accounts[0]; // since the method will return one account

      // decrypt the password first becaue we hashed it in the front
      let _password = decryptAES(password);

      if (account && bcrypt.compareSync(_password, account.password)) {
        if (account.status == MERCHANT_ACCOUNT_STATUS.PENDING)
          return new ApiResponse(1001, null, false);

        if (account.status == MERCHANT_ACCOUNT_STATUS.DESACTIVE)
          return new ApiResponse(1002, null, false);

        merchant.lastLogin = new Date(); // the last login

        //check if testMode is one and merchant not completed
        console.log(merchant.testMode, merchant.onboarding.status);

        if (
          !merchant.testMode &&
          merchant.onboarding.status !== ONBOARDING_STATUS.COMPLETED
        ) {
          merchant.testMode = true;
        }

        await merchant.save();
        return new ApiResponse(0, {
          accountId: account._id,
          merchantId: merchant._id,
        });
      } else {
        return new ApiResponse(1000, null, false);
      }
    }
    return new ApiResponse(1000, null, false);
  }

  async login(payload: JwtPayload) {
    const accessToken = await this.jwtService.sign(payload);
    return new ApiResponse(0, { accessToken });
  }

  // for jwt verification
  async getMerchantAccountByAccountId(accountId: string): Promise<Merchant> {
    const merchant = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            _id: accountId,
          },
        },
      },
      {
        onboarding: 1,
        uid: 1,
        organization: 1,
        settings: 1,
        testMode: 1,
        accounts: {
          $elemMatch: {
            _id: accountId,
          },
        },
      },
    );
    return merchant;
  }

  async getMerchantByAccountEmail(email: string): Promise<Merchant> {
    const merchant = await this.merchantModel.findOne(
      {
        accounts: {
          $elemMatch: {
            email:{$regex : email, $options : 'i'},
          },
        },
      },
      {
        testMode: 1,
        status: 1,
        onboarding: 1,
        accounts: {
          $elemMatch: {
            email:{$regex : email, $options : 'i'},
          },
        },
      },
    );
    console.log(merchant);
    return merchant;
  }
}
