import { DB_CUSTOMER, DB_CUSTOMER_TEST } from './../shared/constants';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';
import { CreateCustomerDto, GetCustomersDto } from './customer.dto';
import {
  ApiResponse,
  generateUID,
  generateUIDWithPrefix,
  isTestModeUID,
} from 'src/shared/helpers';
import { ICustomer } from './customer.interface';
import { PaginateDataTableResponse } from 'src/shared/dto/paginate_data_table_response.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(DB_CUSTOMER) private customerModel: PaginateModel<ICustomer>,
    @InjectModel(DB_CUSTOMER_TEST)
    private customerTestModel: PaginateModel<ICustomer>,
  ) {}

  async addOrUpdateCustomer(body: CreateCustomerDto): Promise<ICustomer> {
    Logger.log(`[Merchant ${body.merchantId}] creating or updating a customer for payment`)
    let customer = await this.getCustomerByPhone(body?.phone,body?.merchantId, body?.testMode);
    
    if (customer) {
      // update the customer
      customer.email = body?.email;
      customer.name = body?.name;
    } else {
      // create new customer
      let uid = await this.generateUID(body?.testMode);
      customer = await this.getCustomerModel(body.testMode).create({
        uid,
        ...body,
      });
    }


    return await customer.save();
  }

  async getCustomers(merchantId: string, query: GetCustomersDto) {
    let { count, offset, query: _search, testMode, isBlacklist } = query;

    let search = {};
    if (_search?.trim()?.length > 0) {
      _search = _search.replace('+', '');
      search = {
        $or: [
          {
            phone: {
              $regex: _search,
              $options: 'i',
            },
          },
          {
            name: {
              $regex: _search,
              $options: 'i',
            },
          },
          {
            email: {
              $regex: _search,
              $options: 'i',
            },
          },
        ],
      };
    }

    const data = await this.getCustomerModel(testMode).paginate(
      {
        merchantId,
        ...search,
        isBlacklist,
      },
      {
        select: 'phone email name _id',
        sort: { createdAt: 'desc' },
        limit: Number(count),
        page: Number(offset),
      },
    );

    let data_response = new PaginateDataTableResponse();
    data_response.data = data.docs;
    data_response.count = data.limit;
    data_response.offset = data.offset;
    data_response.totalCounts = data.total;

    // const data =  await this.getCustomerModel(query?.testMode).find({isBlacklist:false,merchantId});
    return new ApiResponse(0, data_response);
  }

  private getCustomerModel(testMode = true): PaginateModel<ICustomer> {
    return !testMode ? this.customerModel : this.customerTestModel;
  }

  public async getCustomerByPhone(phone: string,merchantId:string, testMode: boolean) {
    return await this.getCustomerModel(testMode).findOne({ phone,merchantId });
  }

  public async getCustomerByID(_id: string, testMode: boolean) {
    return await this.getCustomerModel(testMode).findOne({ _id });
  }

  public async findByUID(uid) {
    return await this.getCustomerModel(isTestModeUID(uid)).findOne({ uid });
  }

  public async generateUID(testMode = true) {
    let uid = null;
    while (uid == null) {
      let _uid = generateUIDWithPrefix('cu', testMode);
      let link = await this.findByUID(_uid);
      if (!link) {
        uid = _uid;
      }
    }
    return uid;
  }
}
