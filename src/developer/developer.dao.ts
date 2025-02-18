import {
  DEVELOPER_SKL_PREFIX,
  DEVELOPER_PKL_PREFIX,
  DEVELOPER_PKT_PREFIX,
  DEVELOPER_SKT_PREFIX,
} from '../shared/constants';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DB_DEVELOPER, DB_DEVELOPER_TEST } from 'src/shared/constants';
import { DeveloperI } from './model/developer.schema';
import { generate } from 'randomstring';
import { RESET_TPYE } from 'src/shared/enums';
import { isLivePublicKey } from 'src/shared/helpers';

@Injectable()
export class DeveloperDAO {
  constructor(
    @InjectModel(DB_DEVELOPER)
    private readonly developerModel: Model<DeveloperI>,
    @InjectModel(DB_DEVELOPER_TEST)
    private readonly developerModelTest: Model<DeveloperI>,
  ) {}

  async getDeveloperByPublicKey(
    publicKey: string
  ): Promise<DeveloperI | null> {
    const isLiveKey  = isLivePublicKey(publicKey)
    const model = this.getDeveloperModel(!isLiveKey);
    return await model.findOne({ publicKey });
  }

  //always use this function to create, update or regenerate new key
  public async createNewKeys(merchant_uid: string, testMode: boolean) {
    //check first if it's already exist
    const existing = await this.getDeveloperByMerchantUID(
      merchant_uid,
      testMode,
    );
    if (existing) await existing.delete();

    const publicKey = this.generateKey(testMode);
    const secretKey = this.generateSecret(testMode);

    const model = this.getDeveloperModel(testMode);
    return await model.create({
      publicKey,
      secretKey,
      merchant_uid,
    });
  }

  public async resetAPIKeys(
    merchant_uid: string,
    testMode: boolean,
    reset_type: RESET_TPYE,
  ) {
    const apiKey = await this.getDeveloperByMerchantUID(merchant_uid, testMode);

    if (reset_type === RESET_TPYE.PUBLIC) {
      apiKey.publicKey = this.generateKey(testMode);
    } else {
      apiKey.secretKey = this.generateSecret(testMode);
    }

    await apiKey.save();
    return apiKey;
  }

  public async getDeveloperByMerchantUID(
    merchant_uid: string,
    testMode: boolean,
  ): Promise<DeveloperI | null> {
    const isTestMode = testMode;
    const model = this.getDeveloperModel(isTestMode);
    return await model.findOne({ merchant_uid });
  }

  public async getDeveloperBySecretKey(
    secretKey: string,
    isLiveKey: boolean,
  ): Promise<DeveloperI | null> {
    const model = this.getDeveloperModel(!isLiveKey);
    return await model.findOne({ secretKey });
  }


  public generateSecret(testMode = true): string {
    let key = generate({
      length: 36,
      charset: 'hex',
    });

    let prefix = DEVELOPER_SKL_PREFIX;
    if (testMode) {
      prefix = DEVELOPER_SKT_PREFIX;
    }

    return `${prefix}${key}`;
  }

  public generateKey(testMode = true): string {
    let key = generate({
      length: 36,
      charset: 'alphanumeric',
    });
    let prefix = DEVELOPER_PKL_PREFIX;
    if (testMode) {
      prefix = DEVELOPER_PKT_PREFIX;
    }
    return `${prefix}${key}`;
  }
  public getDeveloperModel(testMode = true): Model<DeveloperI> {
    return testMode ? this.developerModelTest : this.developerModel;
  }
}
