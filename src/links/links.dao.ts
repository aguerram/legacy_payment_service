import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DB_LINK, DB_LINK_TEST } from 'src/shared/constants';
import { Model, Types } from 'mongoose';
import { ILink } from './links.interfaces';

@Injectable()
export class LinksDAO {
  constructor(
    @InjectModel(DB_LINK)
    private readonly linksModel: Model<ILink>,
    @InjectModel(DB_LINK_TEST)
    private readonly linksModelTest: Model<ILink>,
  ) {}

  async createPaymentLink(data, testMode: boolean) {
    return await this.getLinksModel(testMode).create(data);
  }

  async getListPaymentLinks(
    from: string,
    limit: number,
    merchant,
    liveMode: boolean,
  ) {
    return await this.getLinksModel(!liveMode)
      .find({
        merchant,
        ...(from ? { _id: { $lt: Types.ObjectId(from) } } : {}),
        
      })
      .sort({ createdAt: 'desc', _id: 1 })
      .limit(limit);
  }

  private getLinksModel(testMode: boolean): Model<ILink> {
    return !testMode ? this.linksModel : this.linksModelTest;
  }

  async getLinkByUID(uid, isLiveKey) {
    return await this.getLinksModel(!isLiveKey).findOne({ uid });
  }

  async getPreviousPaymentLink(currentId: string,limit:number, testMode: boolean):Promise<ILink> {
    const data = await this.getLinksModel(testMode)
      .find({ _id: { $gt: Types.ObjectId(currentId) } })
      .sort({createdAt:"desc" ,_id:1})
      .skip(limit)
      .limit(1)

    if (data?.length) return data[0];
    return null;
  }

  async getNextPaymentLink(currentId: string,limit:number, testMode: boolean):Promise<ILink> {
    const data = await this.getLinksModel(testMode)
      .find({ _id: { $lt: Types.ObjectId(currentId) } })
      .sort({createdAt:"desc" ,_id:1})
      .skip(limit)
      .limit(1)

    if (data?.length) return data[0];
    return null;
  }
}
