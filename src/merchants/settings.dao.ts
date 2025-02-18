import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DB_MERCHANT, DB_SETTINGS } from 'src/shared/constants';
import { CHARGE_METHOD } from 'src/shared/enums';
import { UpdatePaymentMethodDTO } from './merchant.dto';
import { Merchant } from './merchant.interfaces';
import { Settings, SettingsMethodRate } from './settings.interface';

@Injectable()
export class SettingsDAO {
  private logger: Logger = new Logger(SettingsDAO.name);
  constructor(
    @InjectModel(DB_SETTINGS) private readonly settingsModel: Model<Settings>,
    @InjectModel(DB_MERCHANT) private readonly merchantModel: Model<Merchant>,
  ) {}

  /**
   * Method to get merchant active payment methods, use merchant UID if you don't have merchant already populated with settings
   * This method filters active method for live (some methods should not be activated in test mode)
   * @param {string} merchantUID
   * @param {Merchant} _merchant
   * @returns
   */
  async getMerchantActiveMethodsLive(
    merchantUID: string,
    _merchant: Merchant,
    testMode: boolean
  ) {
    const activeMethod = await this.getMerchantActiveMethods(
      merchantUID,
      _merchant,
    );

    console.log(activeMethod);
    
    if (!testMode || !activeMethod) return activeMethod;

    //if test mode
    const newActiveMethods = {};
    const enabledMethodsInLive = [
      CHARGE_METHOD.AMEX,
      CHARGE_METHOD.CREDIT_CARD,
      CHARGE_METHOD.APPEL_PAY,
    ];
    enabledMethodsInLive.forEach((ele) => {
      if (activeMethod[ele]) {
        newActiveMethods[ele] = activeMethod[ele];
      }
    });
    return newActiveMethods;
  }

  /**
   * Method to get merchant active payment methods, use merchant UID if you don't have merchant already populated with settings
   * @param {string} merchantUID
   * @param {Merchant} _merchant
   * @returns
   */
  async getMerchantActiveMethods(
    merchantUID: string,
    _merchant?: Merchant,
  ): Promise<{ [key: string]: boolean }> {
    let merchant;
    if (_merchant && _merchant?.settings?.methods) {
      merchant = _merchant;
    } else {
      if (!merchantUID) return null;
      merchant = await this.merchantModel
        .findOne({ uid: merchantUID })
        .populate('settings');
    }
    if (!merchant || !merchant.settings?.methods) {
      this.logger.error(
        `Get merchant active methods was failed,merchant id =${merchant?.id}, uid=${merchantUID}, methods =  ${merchant?.settings?.methods}`,
      );
      return null;
    }

    const active: { [key: string]: boolean } = {};
    const methods = merchant.settings.methods;    
    for (let method of Object.keys(methods)) {
      if (!methods[method]?.enabled) continue;
      active[method] = true;
    }
    //if credit card is disabled and amex is actived, no need to return it as active method
    if (active[CHARGE_METHOD.AMEX] && !active[CHARGE_METHOD.CREDIT_CARD])
      delete active[CHARGE_METHOD.AMEX];
      
    return active;
  }

  async createMerchantSettings() {
    return new this.settingsModel().save();
  }

  async updatePaymentMethods(merchant: Merchant, data: UpdatePaymentMethodDTO) {
    //  update merchant settings
    const settings = await this.settingsModel.findOne({
      _id: merchant.settings,
    });

    // check if user tried to update amex but credit is disabled
    if (
      data.method === CHARGE_METHOD.AMEX &&
      !settings.methods.creditcard.enabled
    ) {
      return this.getMerchantActiveMethods(merchant?.uid, merchant);
    }

    settings.methods[data?.method].enabled = data?.enabled;
    await settings.save();
    return this.getMerchantActiveMethods(merchant?.uid, merchant);
  }

  async getMerchantMethodFees(
    merchant: Merchant,
    method: CHARGE_METHOD,
  ): Promise<SettingsMethodRate> {
    const DEFAULT_RATE:SettingsMethodRate = {
      percentage: 2.9,
      fixed: 1,
      minimumFees: 2.5,
    };
    this.logger.log(
      `Trying to get fees of method ${method} for merchant ${merchant?.id}`,
    );
    if (!merchant || !method) {
      return DEFAULT_RATE;
    }

    merchant = await merchant.populate('settings').execPopulate();

    if (!merchant) {
      this.logger.error(`Error while populating merchant.`);
      return DEFAULT_RATE;
    }
    const methods = merchant.settings?.methods;
    if (!methods) return DEFAULT_RATE;
    const rate = methods[method]?.options?.rate;
    if (rate) {
      this.logger.log(
        `Rate found for merchant ${
          merchant.uid
        } of method ${method}, rate = ${JSON.stringify(rate)}`,
      );
      return rate;
    } else {
      this.logger.log(
        `Rate was not found for merchant ${merchant.uid} of method ${method}, returning default.`,
      );
    }
    return DEFAULT_RATE;
  }
}
