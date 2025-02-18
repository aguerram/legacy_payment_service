/* eslint-disable prettier/prettier */

import { Merchant } from "src/merchants/merchant.interfaces";
import { TRANSACTION_STATUS } from "src/shared/enums";
import { Transaction } from "src/transactions/transaction.interfaces";

export class GetMerchantMapper {
    static mapper(merchant: Merchant) {
        return {
            organization: merchant.organization,
            representative: merchant.representative,
            profile: {
                categoryCode: merchant.profile.categoryCode
            }
        }
    }
}

export class GetTransactionMapper {
    static mapper(transaction:Transaction){
        return {
            uid:transaction.uid,
            ip:transaction.log?.cardHolderIp,
            status:transaction.status,
            success:transaction.status !== TRANSACTION_STATUS.FAILED,
            amount:transaction.amount,
            fees:transaction.fees,
            amount_net:transaction.amount_net,
            amountRemaining:transaction.amountRemaining,
            currency:transaction.currency,
            countryCode:transaction.countryCode,
            customer:transaction.customer,
            createdAt:transaction.createdAt
        }
    }
}