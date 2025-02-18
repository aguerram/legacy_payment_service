import { DB_BALANCE } from './../shared/constants';
import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { IBalance } from './balance.interfaces';
import { InjectModel } from '@nestjs/mongoose';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { SETTLEMENT_STATUS } from 'src/shared/enums';


@Injectable()
export class SettlementsDAO{

    constructor(
        @InjectModel(DB_BALANCE) private readonly balanceModel:Model<IBalance>,
    ){}

    async getSettlementOfMerchantByUID(merchant_id:string,uid:string){
        return this.balanceModel.findOne({uid,merchant_id});
    }


    async getListSettlements(from:string,limit:number,merchant_id:string){
        return await this.balanceModel
      .find({
        merchant_id,
        status:{$ne:SETTLEMENT_STATUS.PENDING},
        ...(from ? { _id: { $lt: Types.ObjectId(from) } } : {}),
        
      })
      .sort({ createdAt: 'desc', _id: 1 })
      .limit(limit);
    }


    async getPreviousSettlement(currentId:string,limit:number):Promise<IBalance>{
        const data = await this.balanceModel
      .find({ _id: { $gt: Types.ObjectId(currentId) }, status:{$ne:SETTLEMENT_STATUS.PENDING}, })
      .sort({createdAt:"desc" ,_id:1})
      .skip(limit)
      .limit(1)

    if (data?.length) return data[0];
    return null;
        
    }

    async getNextSettlement(currentId:string,limit:number):Promise<IBalance>{
      const data = await this.balanceModel
    .find({ _id: { $lt: Types.ObjectId(currentId) }, status:{$ne:SETTLEMENT_STATUS.PENDING}, })
    .sort({createdAt:"desc" ,_id:1})
    .skip(limit)
    .limit(1)

    if (data?.length) return data[0];
    return null;
      
  }

}

