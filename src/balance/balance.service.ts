import { DB_TRANSACTION } from 'src/shared/constants';
import { TRANSACTION_STATUS, SETTLEMENT_STATUS } from 'src/shared/enums';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { BalanceSettingsDto, BalanceDataTableResponse } from './balance.dto';
import {
  ApiResponse,
  isSettlemntDays,
  getMondayDate,
  getThreeDaysAfterMondayDate,
} from './../shared/helpers';
import { IBalance } from './balance.interfaces';
import { DB_BALANCE } from './../shared/constants';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, Model, Types, get } from 'mongoose';

@Injectable()
export class BalanceService {
  constructor(
    @InjectModel(DB_BALANCE)
    private readonly balanceModel: PaginateModel<IBalance>,
    @InjectModel(DB_TRANSACTION)
    private readonly transactionModel: PaginateModel<Transaction>,
  ) {}

  async getMerchantBalances(body: BalanceSettingsDto, merchant_id: string) {
    let { count: limit, offset: page, to, from } = body;

    let balances = await this.balanceModel.paginate(
      {
        merchant_id,
        status: SETTLEMENT_STATUS.PAID_OUT,
        createdAt: {
          $gte: from,
          $lte: to,
        },
      },

      { page, limit, sort: { createdAt: 'desc' } },
    );

    let data = new BalanceDataTableResponse();
    data.data = balances.docs;
    data.count = balances.limit;
    data.offset = balances.offset;
    data.totalCounts = balances.total;
    data.availableBalance = await this.getAvailableBalanceAndOnHoldBalance(
      merchant_id,
    );
    data.sentToBank = await this.getSentToBankBalance(merchant_id);
    data.onHold = await this.getAvailableBalanceAndOnHoldBalance(
      merchant_id,
      true,
    );

    return new ApiResponse(0, data);
  }

  async getBalanceInfo(merchant_id: string, uid: string) {
    try {
      let data = await this.balanceModel
        .findOne(
          {
            uid,
            merchant_id,
          },
          {
            amount: 1,
            amount_net: 1,
            fees: 1,
            refund_deducted: 1,
            status: 1,
            _id: 0,
            transactions: 1,
            settledAt: 1,
            currency: 1,
            bankAccount: 1,
          },
        )
        .populate({
          path: 'transactions',
          model: DB_TRANSACTION,
        })
        .exec();

      if (!data) throw new NotFoundException();
      return new ApiResponse(0, data);
    } catch (error) {
      console.log(error);
      return new ApiResponse(2000, null, false);
    }
  }

  private async getSentToBankBalance(merchant_id: string) {
    if (!isSettlemntDays()) {
      return 0;
    } else {
      const mondayDate = getMondayDate();
      const ThreeDaysAfterMonday = getThreeDaysAfterMondayDate(mondayDate);
      const aggregatorOpts = [
        {
          $match: {
            merchant_id: Types.ObjectId(merchant_id),
            status: SETTLEMENT_STATUS.PAID_OUT,
            settledAt: {
              $gte: mondayDate,
              $lte: ThreeDaysAfterMonday,
            },
          },
        },
        {
          $group: {
            _id: '$status',
            total: {
              $sum: '$amount_net',
            },
          },
        },
      ];

      const data = await this.balanceModel.aggregate(aggregatorOpts).exec();
      return data.length > 0 ? data[0].total : 0;
    }
  }

  private async getAvailableBalanceAndOnHoldBalance(
    merchant_id: string,
    isOnHold: boolean = false,
  ) {
    const status = isOnHold
      ? TRANSACTION_STATUS.ON_HOLD
      : TRANSACTION_STATUS.SUCCEEDED;
    const aggregatorOpts = [
      {
        $match: {
          merchant_id: Types.ObjectId(merchant_id),
          status,
        },
      },
      {
        $group: {
          _id: '$status',
          total: {
            $sum: '$amount_net',
          },
        },
      },
    ];

    const data = await this.transactionModel.aggregate(aggregatorOpts).exec();
    return data.length > 0 ? data[0].total : 0;
  }
}
