import { ILink } from "src/links/links.interfaces";
import { GetPaymentLinkDto, PaymentLink_LinksDto } from "./payment-links.dto";
import { isTestModeUID } from "src/shared/helpers";
import { MODE, BASE_URL, RESPONSE_TYPE, FRONT_URL, DOCS_URLS } from "src/shared/constants";
import { WebLinkDto } from "src/shared/dto/navigate_links_dto";


export class GetPaymentLink {
    static mapper(link:ILink,doc_url:string=DOCS_URLS.GET_PAYMENT_LINK) {
       const data = new GetPaymentLinkDto();
       data.amount = link.amount;
       data.redirectUrl = link.redirectUrl;
       data.name = link.name;
       data.id=link.uid;
       data.description = link.description;
       data.createdAt = link.createdAt;
       data.updatedAt = link.updatedAt;
       data.expiresAt = link.expiresAt;
       data.reusable = link.reusable;
       data.id=link.uid;
       data.status = link.status;
       data.currency = link.currency;
       data.mode = isTestModeUID(link.uid) ? MODE.TEST : MODE.LIVE;
 
       const self = new WebLinkDto(`${BASE_URL}/v1/payement-links/${link?.uid}`, RESPONSE_TYPE.JSON);
       const paymentLink = new WebLinkDto(`${FRONT_URL}/pay/${link?.uid}`);
 
       data._links = new PaymentLink_LinksDto(self, paymentLink,doc_url);

       return data;
    }
}
