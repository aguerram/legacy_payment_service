import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, Types } from 'mongoose';
import { ObjectID } from 'mongodb';
import { Merchant } from 'src/merchants/merchant.interfaces';
import {
  DB_MERCHANT,
  DB_TRANSACTION,
  DB_TRANSACTION_TEST,
} from 'src/shared/constants';
import { TRANSACTION_STATUS } from 'src/shared/enums';
import { ApiResponse, isNumberBetween, parseAmount } from 'src/shared/helpers';
import { Transaction } from 'src/transactions/transaction.interfaces';
import { GetInsightsDTO } from './insights.dto';
import { ChartType } from './insights.enum';
import * as moment from 'moment';
import { result } from 'lodash';
@Injectable()
export class InsightsService {
  constructor(
    @InjectModel(DB_MERCHANT) private merchantModel: Model<Merchant>,
    @InjectModel(DB_TRANSACTION)
    private transactionModel: PaginateModel<Transaction>,
    @InjectModel(DB_TRANSACTION_TEST)
    private transactionModelTest: PaginateModel<Transaction>,
  ) {}

  private momentDate(date: any, dateOnly = false): moment.Moment {
    // if (dateOnly)
    //     return moment(moment(date).format("Y-MM-D"))
    return moment(date);
  }

  async getInsights(merchantId: string, body: GetInsightsDTO) {
    const merchant = await this.getMerchantById(merchantId);
    if (!merchant) throw new NotFoundException();

    let startDate = moment(body.from),
      endDate = moment(body.to),
      merchantCreatedAt = moment(merchant.get('createdAt'));
    const distanceInHours = endDate.diff(startDate, 'hours');

    // const SHOW_IN_HOURS = distanceInHours <= (24 * 3)
    const SHOW_IN_HOURS = body.inHours;
    //check if we're trying to get data before merchant account is created
    if (startDate.diff(merchantCreatedAt, 'hours') < 0) {
        //TODO fix this it suppos to return all time statistics
      if (merchantCreatedAt.diff(startDate, 'M') > 3) {
        startDate = merchantCreatedAt.add('M',3)
      } else {
        startDate = merchantCreatedAt;
      }
    }
    console.log(startDate, endDate);

    let group: any = {
      day: {
        $dayOfMonth: '$paidAt',
      },
      month: {
        $month: '$paidAt',
      },
      year: {
        $year: '$paidAt',
      },
    };
    let sort: any = {
      '_id.year': 1,
      '_id.month': 1,
      '_id.day': 1,
    };

    const globalCondition = {
      merchant_id: new ObjectID(merchantId),
      paidAt: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
      status: {
        $ne: TRANSACTION_STATUS.FAILED,
      },
    };

    //if we'are not  trying to get results of 7 days distance
    if (SHOW_IN_HOURS) {
      group = {
        ...group,
        hour: {
          $hour: '$paidAt',
        },
      };
      sort = {
        ...sort,
        '_id.hour': 1,
      };
    }

    const totalAmountForRefundedTransactions = await this.getTransactionModel(body.testMode)
      .aggregate([
        {
          $match: {
            merchant_id: new ObjectID(merchantId),
            status: {
              $in: [TRANSACTION_STATUS.REFUNDED,TRANSACTION_STATUS.PARTIALLY_REFUNDED] ,
            },
          },
        },
        {
          $group: { 
            _id: '$status',
            total: { $sum: '$amount' },
          },
        },
      ])
      .sort({ total: -1 });

      const totalRemainingForRefundedTransactions = await this.getTransactionModel(body.testMode)
      .aggregate([
        {
          $match: {
            merchant_id: new ObjectID(merchantId),
            status: {
              $in: [TRANSACTION_STATUS.REFUNDED,TRANSACTION_STATUS.PARTIALLY_REFUNDED] ,
            },
          },
        },
        {
          $group: { 
            _id: '$status',
            total: { $sum: '$amountRemaining' },
          },
        },
      ])
      .sort({ total: -1 });

    const periodStatistics = await this.getTransactionModel(body.testMode)
      .aggregate([
        {
          $match: {
            ...globalCondition,
          },
        },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amountRemaining' },
          },
        },
      ])
      .sort({ total: -1 });

      const totalStatistics = await this.getTransactionModel(body.testMode)
      .aggregate([
        {
          $match: {
            ...globalCondition,
          },
        },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
          },
        },
      ])
      .sort({ total: -1 });


    let periodStatisticsFiltred = {};
    for (let item of periodStatistics) {
      periodStatisticsFiltred[item._id] = item.total;
    }

    const sumAmountForRefundedTransactions = totalAmountForRefundedTransactions.reduce((total, cur, curIn) => {
      return total + cur.total;
    }, 0); 
    const sumRemainingForRefundedTransactions = totalRemainingForRefundedTransactions.reduce((total, cur, curIn) => {
      return total + cur.total;
    }, 0);

    const totalRefund=sumAmountForRefundedTransactions -sumRemainingForRefundedTransactions;

    let results = await this.getTransactionModel(body.testMode)
      .aggregate([
        {
          $match: {
            ...globalCondition,
          },
        },
        {
          $group: {
            _id: {
              ...group,
            },
            total: { $sum: '$amountRemaining' },
          },
        },
      ])
      .sort({
        ...sort,
      });

    let resultsFiltred = [];
    if (true) {
      let currentDate = this.momentDate(startDate, SHOW_IN_HOURS);
      // let lastDate = this.momentDate(this.extractDate(results[results.length - 1]._id, SHOW_IN_HOURS), SHOW_IN_HOURS)
      let lastDate = this.momentDate(endDate, SHOW_IN_HOURS);
      let itemsCurrentIndex = 0;
      let countRun = 0;

      while (currentDate.diff(lastDate) <= 0) {
        const item = results[itemsCurrentIndex];
        let date: moment.Moment;

        if (item)
          date = this.momentDate(
            this.extractDate(item._id, SHOW_IN_HOURS),
            SHOW_IN_HOURS,
          );
        else {
          date = this.momentDate(startDate);
        }
        const distance = date.diff(
          currentDate,
          SHOW_IN_HOURS ? 'minutes' : 'hours',
        );

        if (countRun++ > 100) {
          //to avoid infinite loop
          break;
        }
        //Same date
        if (isNumberBetween(distance, 0, 1)) {
          if (item) {
            resultsFiltred.push({
              date: date.toDate(),
              total: parseAmount(item.total),
            });
            itemsCurrentIndex++;
            currentDate = date.clone();
          } else {
            resultsFiltred.push({
              date: currentDate.toDate(),
              total: 0,
            });
          }
        }
        //is before that date
        else if (distance < 0) {
          if (itemsCurrentIndex < results.length) {
            currentDate = date;
            continue;
          } else {
            resultsFiltred.push({
              date: currentDate.toDate(),
              total: 0,
            });
          }
        } else {
          resultsFiltred.push({
            date: currentDate.toDate(),
            total: 0,
          });
          // currentDate = date
        }
        currentDate.add(1, SHOW_IN_HOURS ? 'hours' : 'days');
      }
    }

    //extra filter on results
    if (resultsFiltred?.length === 0) {
      resultsFiltred.push({
        date: endDate,
        total: 0,
      });
    }
    if (resultsFiltred?.length > 30) {
      let elementsToRemove = 0;
      for (let i = 0; i < resultsFiltred?.length - 1; i++) {
        const currentElement = resultsFiltred[i];
        const nextElement = resultsFiltred[i + 1];
        if (currentElement.total === 0 && nextElement.total === 0) {
          elementsToRemove++;
        } else {
          break;
        }
      }

      resultsFiltred = resultsFiltred.slice(elementsToRemove);
    }

    const totalAmount = totalStatistics.reduce((total, cur, curIn) => {
      return total + cur.total;
    }, 0);

    const nbSuccessTransactions = await this.getTransactionModel(
      body.testMode,
    ).count({
      merchant_id: merchantId,
      status: { $ne: TRANSACTION_STATUS.FAILED },
      createdAt: {
        $gte: body.from,
        $lte: body.to,
      },
    });

    const nbAllTransactions = await this.getTransactionModel(
      body.testMode,
    ).count({
      merchant_id: merchantId,
      createdAt: {
        $gte: body.from,
        $lte: body.to,
      },
    });

    const grossVolume = await (await this.getVolumeAmount(merchantId, body))
      ?.amount;
    const sumFees = await (await this.getVolumeAmount(merchantId, body, true))
      ?.amount;

    let successPaymentsPercentage = Number(
      (nbSuccessTransactions * 100) / nbAllTransactions,
    ).toFixed(2); //NaN in case nbAll is 0
    if (nbAllTransactions === 0) {
      successPaymentsPercentage = '0';
    }

    return new ApiResponse(0, {
      type: SHOW_IN_HOURS ? ChartType.HOURS : ChartType.DAYS,
      results: resultsFiltred,
      //totalStatistics: totalStatisticsFiltred,
      //periodStatistics: periodStatisticsFiltred,
      totalRefund,
      totalAmount,
      grossVolume,
      netVolume: grossVolume - sumFees,
      successPayments: nbSuccessTransactions,
      successPaymentsPercentage,
      //totalTransactions:nbAllTransactions,
    });
  }

  private extractDate(
    date: { year: number; month: number; day: number; hour?: number },
    SHOW_IN_HOURS: boolean,
  ): Date {
    let dateToStore = `${date.year}-${String(Number(date.month)).padStart(
      2,
      '0',
    )}-${String(date.day).padStart(2, '0')}T${
      SHOW_IN_HOURS ? String(date.hour).padStart(2, '0') : '00'
    }:00:00.000Z`;
    return new Date(dateToStore);
  }

  private async getMerchantById(id: string) {
    return await this.merchantModel.findById(id);
  }

  private getTransactionModel(testMode = true) {
    return !testMode ? this.transactionModel : this.transactionModelTest;
  }

  private async getVolumeAmount(merchantId, body, sumFees = false) {
    let aggregatorOpts = [
      {
        $match: {
          merchant_id: Types.ObjectId(merchantId),
          status: { $ne: TRANSACTION_STATUS.FAILED },
          createdAt: {
            $gte: body.from,
            $lte: body.to,
          },
        },
      },
      {
        $group: {
          _id: null,

          ...(sumFees
            ? { amount: { $sum: '$fees' } }
            : { amount: { $sum: '$amountRemaining' } }),
        },
      },
    ];

    const volumeAmount = await this.getTransactionModel(body.testMode)
      .aggregate(aggregatorOpts)
      .exec();
    return volumeAmount[0];
  }
}
