import { GetSettlement } from './settlements.mappers';
import { Injectable, BadRequestException } from '@nestjs/common';
import { SettlementsDAO } from 'src/balance/settlement.dao';
import { Merchant } from 'src/merchants/merchant.interfaces';
import {
  QueryPaginationDto,
  WebLinkDto,
  ListNaviagateLinksDto,
} from 'src/shared/dto/navigate_links_dto';
import { BalanceService } from 'src/balance/balance.service';
import { ApiErrorResponse, generateNavigateLink } from 'src/shared/helpers';
import {
  DOCS_URLS,
  RESPONSE_TYPE,
  API_URLS,
  RESPONSE_ERROR_URLS,
} from 'src/shared/constants';
import { ListDataResponse } from 'src/shared/dto/keyset_pagination_dto';
import { GetSettlementDto } from './settlement.dto';

@Injectable()
export class SettlementsService {
  constructor(private readonly settlementsDao: SettlementsDAO) {}

  async getSettlement(
    merchant_id: string,
    uid: string,
    isLiveKey: boolean,
  ): Promise<GetSettlementDto | ApiErrorResponse> {
    if (isLiveKey) {
      const settlement = await this.settlementsDao.getSettlementOfMerchantByUID(
        merchant_id,
        uid,
      );
      if (settlement) {
        return GetSettlement.mapper(settlement);
      } else {
        const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
        return new ApiErrorResponse(
          404,
          'Not Found',
          `No settltement exists with ID ${uid}.`,
          { documentation },
        );
        //throw new BadRequestException({message:"Invalid settlement ID"});
      }
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `You can't use test API to retrieve a settlement, you need live api.`,
        { documentation },
      );
    }
  }

  async ListSettlements(
    query: QueryPaginationDto,
    merchant_id: string,
    isLiveKey: boolean,
  ): Promise<ListDataResponse<GetSettlementDto> | ApiErrorResponse> {
    if (isLiveKey) {
      let { from, limit } = query || {};

      const data = await this.settlementsDao.getListSettlements(
        from,
        limit,
        merchant_id,
      );

      const _embedded = [];
      for (let settlement of data) {
        _embedded.push(GetSettlement.mapper(settlement));
      }

      const previousLink = await this.settlementsDao.getPreviousSettlement(
        from,
        limit,
      );
      const nextLink = await this.settlementsDao.getNextSettlement(from, limit);
      const currentLink = data[0]?._id;

      const self = generateNavigateLink(
        API_URLS.SETTLEMENTS,
        from || currentLink,
        limit,
      );
      const previous = generateNavigateLink(
        API_URLS.SETTLEMENTS,
        previousLink?._id,
        limit,
      );
      const next = generateNavigateLink(
        API_URLS.SETTLEMENTS,
        nextLink?._id,
        limit,
      );
      const documentation = new WebLinkDto(
        DOCS_URLS.LIST_SETTLEMENTS,
        RESPONSE_TYPE.HTML,
      );
      const _links = new ListNaviagateLinksDto(
        self,
        previous,
        next,
        documentation,
      );
      const response = new ListDataResponse<GetSettlementDto>();
      response.count = data?.length;
      response._links = _links;
      response._embedded = _embedded;

      return response;
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `You can't use test API to retrieve a settlement, you need live api.`,
        { documentation },
      );
    }
  }
}
