import { BASE_URL, RESPONSE_TYPE,RESSOURCES } from "src/shared/constants";
import { WebLinkDto } from "src/shared/dto/navigate_links_dto";
import { GetSettlementDto, Settlement_LinksDto } from "./settlement.dto";
import { IBalance } from "src/balance/balance.interfaces";


export class GetSettlement {
    static mapper(settlement:IBalance) {
       const data = new GetSettlementDto();
       data.resource=RESSOURCES.SETTLEMENT;
       data.amount = settlement.amount;
       data.createdAt = settlement.createdAt;
       data.updatedAt = settlement.updatedAt;
       data.settledAt = settlement.settledAt;
       data.currency = settlement.currency;
       data.reference = settlement.reference;
       data.status = settlement.status;
       data.id=settlement.uid;

 
       const self = new WebLinkDto(`${BASE_URL}/v1/settlements/${settlement?.uid}`, RESPONSE_TYPE.JSON);
       //const paymentLink = new WebLinkDto(`${FRONT_URL}/pay/${settlement?.uid}`);
 
       data._links = new Settlement_LinksDto(self);

       return data;
    }
}
