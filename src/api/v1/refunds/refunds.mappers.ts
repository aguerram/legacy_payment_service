import { BASE_URL, RESPONSE_TYPE,RESSOURCES, MODE, DOCS_URLS } from "src/shared/constants";
import { WebLinkDto } from "src/shared/dto/navigate_links_dto";
import { TransactionRefund } from "src/transactions/transaction.interfaces";
import { isTestModeUID } from "src/shared/helpers";
import { GetPaymentRefundDto, Refunds_LinksDto } from "./refunds.dto";


export class GetRefund {
    static mapper(refund:TransactionRefund,payment_uid:string,doc_url:string=DOCS_URLS.GET_REUFUND) {
       const data = new GetPaymentRefundDto();
       data.resource=RESSOURCES.PAYMENT_REFUND;
       data.amount = refund.amount;
       data.currency = refund.currency;
       data.createdAt = refund.createdAt;
       data.status = refund.status;
       data.paymentId =payment_uid;
       data.id=refund.uid;
       data.mode=isTestModeUID(refund.uid) ? MODE.TEST : MODE.LIVE;
       data.description=refund.description;
 
       const self = new WebLinkDto(`${BASE_URL}/v1/payments/${payment_uid}/refunds/${refund?.uid}`, RESPONSE_TYPE.JSON); 
       const payment = new WebLinkDto(`${BASE_URL}/v1/payments/${payment_uid}`, RESPONSE_TYPE.JSON); 
       data._links = new Refunds_LinksDto(self,payment,doc_url);

       return data;
    }
}
