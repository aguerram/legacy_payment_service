import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  DB_TRANSACTION,
  DB_TRANSACTION_REFUNDS,
  DB_TRANSACTION_REFUNDS_TEST,
  DB_TRANSACTION_TEST,
} from 'src/shared/constants';
import { Model } from 'mongoose';
import { Transaction, TransactionRefund } from './transaction.interfaces';
import { CreateRefundDto } from './transaction.dto';
import {
  accurateMoney,
  ApiResponse,
  generateUIDWithPrefix,
  isTestModeUID,
} from 'src/shared/helpers';
import { SaveRefundDTO } from 'src/private/private-links/private-links.dto';
import {
  TRANSACTION_REFUND_STATUS,
  TRANSACTION_STATUS,
} from 'src/shared/enums';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransactionRefundsService {
  constructor(
    @InjectModel(DB_TRANSACTION_REFUNDS)
    private refundModel: Model<TransactionRefund>,
    @InjectModel(DB_TRANSACTION_REFUNDS_TEST)
    private refundModelTest: Model<TransactionRefund>,
    @InjectModel(DB_TRANSACTION) private transactionModel: Model<Transaction>,
    @InjectModel(DB_TRANSACTION_TEST)
    private transactionModelTest: Model<Transaction>,
  ) {}

  async createRefund(
    refundDto: CreateRefundDto,
    trUID: string,
  ): Promise<TransactionRefund> {
    let refundNew = {
      amount: refundDto.amount,
      description: refundDto.description,
      metadata: refundDto.metadata,
      refundedAt: new Date(),
      uid: await this.generateRefundID(isTestModeUID(trUID)),
    };
    const model = !isTestModeUID(trUID)
      ? this.refundModel
      : this.refundModelTest;
    let refund = new model(refundNew);
    await refund.save();
    return refund;
  }

  async getRefundByUID(uid: string) {
    return await this.getTransactionRefundModel(isTestModeUID(uid)).findOne({
      uid,
    });
  }

  async getManyRefunds(refuds: string[], testMode: boolean) {
    const model = await this.getTransactionRefundModel(testMode);
    return await model.find({
      uid: {
        $in: refuds,
      },
    });
  }

  async saveProcessedRefund(uid: string, trUID: string, data: SaveRefundDTO) {
    //save transaction from payment service
    try {
      const refund = await this.getRefundByUID(uid);
      const transaction = await this.getTransactionModel(
        isTestModeUID(trUID),
      ).findOne({ uid: trUID });
      if (!refund || !transaction) throw new NotFoundException();

      refund.status = data.status;
      if (data.status === TRANSACTION_REFUND_STATUS.FAILDED) {
        refund.failedAt = data.date;
      } else {
        //refund is successfull
        transaction.amountRemaining = data.remainingAmount;
        transaction.amountRefunded = accurateMoney(
          Number(transaction.amount) - Number(data.remainingAmount),
        );
        refund.paidAt = data.date;

        //check refund status
        //check if partial
        if (Number(data.remainingAmount) === 0) {
          transaction.status = TRANSACTION_STATUS.REFUNDED;
        } else {
          transaction.status = TRANSACTION_STATUS.PARTIALLY_REFUNDED;
        }
      }

      //refund.metadata = data.metadata
      await refund.save();
      await transaction.save();
      return new ApiResponse(0, true, true);
    } catch (ex) {
      console.log(ex);
    }
    return new ApiResponse(0, false, false);
  }

  async generateRefundID(testMode = true) {
    let uid = null,
      _uid = null;
    while (uid == null) {
      let _uid = generateUIDWithPrefix('re', testMode);
      let ord = await this.getRefundByUID(_uid);
      if (!ord) {
        uid = _uid;
      }
    }
    return uid;
  }

  private getTransactionRefundModel(testMode = true) {
    return !testMode ? this.refundModel : this.refundModelTest;
  }
  private getTransactionModel(testMode = true) {
    return !testMode ? this.transactionModel : this.transactionModelTest;
  }
}
