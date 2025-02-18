import { DB_MERCHANT } from './../shared/constants';
import { Injectable } from "@nestjs/common";
import { Model } from 'mongoose';
import { Merchant } from './merchant.interfaces';
import { InjectModel } from '@nestjs/mongoose';


@Injectable()
export class MerchantDAO{

    constructor(
        @InjectModel(DB_MERCHANT)
        private readonly merchantModel: Model<Merchant>
    ){}


    async getAllMerchantUIDs(){
        return await this.merchantModel.find({},{uid:1});
    }

}