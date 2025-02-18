import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Merchant } from 'src/merchants/merchant.interfaces';
import {
  ApiResponse,
  isTestModeUID,
} from 'src/shared/helpers';
import { DeveloperDAO } from './developer.dao';
import { TransactionsService } from 'src/transactions/transactions.service';
import { RESET_TPYE } from 'src/shared/enums';
@Injectable()
export class DeveloperService {
  constructor(
    private readonly developerDAO: DeveloperDAO,
    private readonly transactionService: TransactionsService,
  ) {}

  //this is called from settings
  public async getDeveloperInfo(merchant: Merchant) {
    const developer = await this.developerDAO.getDeveloperByMerchantUID(
      merchant.uid,
      merchant?.testMode,
    );
    if (!developer) {
      const created = await this.developerDAO.createNewKeys(
        merchant.uid,
        merchant?.testMode,
      );
      return new ApiResponse(0, created, !!created);
    }
    return new ApiResponse(0, developer, !!developer);
  }


  public async resetDeveloperInfo(merchant: Merchant, reset_type: RESET_TPYE) {
    const updated = await this.developerDAO.resetAPIKeys(
      merchant?.uid,
      merchant?.testMode,
      reset_type,
    );
    return new ApiResponse(0, updated, !!updated);
  }
  //--------------------------------------------------------------

  async getTransaction(merchant: Merchant, uid: string, isLiveKey: boolean) {
    if (!isTestModeUID(uid) && !isLiveKey) {
      throw new NotFoundException();
    }
    const transaction = await this.transactionService.findByUID(uid);
    if (
      !transaction ||
      String(transaction.merchant_id) !== String(merchant.id)
    ) {
      throw new NotFoundException(`Transaction uid ${uid} not found`);
    }
    return transaction;
  }
}
