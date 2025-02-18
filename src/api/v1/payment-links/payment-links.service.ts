import { Injectable, BadRequestException } from '@nestjs/common';
import { LinksService } from 'src/links/links.service';
import { GetPaymentLink } from './payment-links.mappers';
import {
  CreatePaymentLinkDto,
  GetPaymentLinkDto,
  CreatePaymentLinkRecord,
} from './payment-links.dto';
import { LinksDAO } from 'src/links/links.dao';
import { ApiErrorResponse, generateNavigateLink } from 'src/shared/helpers';
import { Merchant } from 'src/merchants/merchant.interfaces';
import {
  QueryPaginationDto,
  ListNaviagateLinksDto,
  WebLinkDto,
} from 'src/shared/dto/navigate_links_dto';
import {
  DOCS_URLS,
  RESPONSE_TYPE,
  API_URLS,
  RESPONSE_ERROR_URLS,
} from 'src/shared/constants';
import { ListDataResponse } from 'src/shared/dto/keyset_pagination_dto';

@Injectable()
export class PaymentLinksService {
  constructor(
    private readonly linksService: LinksService,
    private readonly linksDao: LinksDAO,
  ) {}

  async getPaymentLink(
    uid: string,
    isLiveKey: boolean,
  ): Promise<GetPaymentLinkDto | ApiErrorResponse> {
    const link = await this.linksDao.getLinkByUID(uid, isLiveKey);

    if (link) {
      return GetPaymentLink.mapper(link);
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        404,
        'Not Found',
        `No payment link exists with ID ${uid}.`,
        { documentation },
      );
    }
  }

  async getListPaymentLinks(
    query: QueryPaginationDto,
    merchant: Merchant,
    isLiveKey: boolean,
  ) {
    let { from, limit } = query || {};

    const data = await this.linksDao.getListPaymentLinks(
      from,
      limit,
      merchant,
      isLiveKey,
    );

    const _embedded = [];
    for (let link of data) {
      _embedded.push(GetPaymentLink.mapper(link));
    }

    const previousLink = await this.linksDao.getPreviousPaymentLink(
      from,
      limit,
      !isLiveKey,
    );
    const nextLink = await this.linksDao.getNextPaymentLink(
      from,
      limit,
      !isLiveKey,
    );
    const currentLink = data[0]?._id;

    const self = generateNavigateLink(
      API_URLS.PAYMENT_LINKS,
      from || currentLink,
      limit,
    );
    const previous = generateNavigateLink(
      API_URLS.PAYMENT_LINKS,
      previousLink?._id,
      limit,
    );
    const next = generateNavigateLink(
      API_URLS.PAYMENT_LINKS,
      nextLink?._id,
      limit,
    );
    const documentation = new WebLinkDto(
      DOCS_URLS.LIST_PAYMENT_LINKS,
      RESPONSE_TYPE.HTML,
    );
    const _links = new ListNaviagateLinksDto(
      self,
      previous,
      next,
      documentation,
    );
    const response = new ListDataResponse<GetPaymentLinkDto>();
    response.count = data?.length;
    response._links = _links;
    response._embedded = _embedded;

    return response;
  }

  async createPaymentLink(
    data: CreatePaymentLinkDto,
    merchant: Merchant,
    isLiveKey: boolean,
  ) :Promise<GetPaymentLinkDto | ApiErrorResponse>{
    const record = new CreatePaymentLinkRecord();
    record.merchant = merchant;
    record.uid = await this.linksService.generateUID(!isLiveKey);
    record.amount = data.amount;
    record.description = data.description;
    record.expiresAt = data.expiresAt;
    record.name = data.name;
    record.redirectUrl = data.redirectUrl;
    record.reusable = data.reusable;
    record.notifyWithSms = data.notifyWithSms;
    const link = await this.linksDao.createPaymentLink(record, !isLiveKey);

    if (link) {
      if (link?.notifyWithSms) {
        await this.linksService.resendSmsMessage(link?.uid, merchant?.id);
      }
      return GetPaymentLink.mapper(link, DOCS_URLS.CREATE_PAYMENT_LINK);
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `Unable to create the payment link, please try again.`,
        { documentation },
      );
    }
  }
}
