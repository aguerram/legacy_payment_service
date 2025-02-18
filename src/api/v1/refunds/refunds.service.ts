import { Injectable, BadRequestException } from '@nestjs/common';
import { TransactionsDAO } from 'src/transactions/transaction.dao';
import { GetListRefunds, GetPaymentRefundDto } from './refunds.dto';
import { GetRefund } from './refunds.mappers';
import { TransactionsService } from 'src/transactions/transactions.service';
import { CreateRefundDto } from 'src/transactions/transaction.dto';
import {
  DOCS_URLS,
  RESPONSE_TYPE,
  API_URLS,
  RESPONSE_ERROR_URLS,
} from 'src/shared/constants';
import { ApiErrorResponse, generateNavigateLink } from 'src/shared/helpers';
import {
  WebLinkDto,
  ListNaviagateLinksDto,
} from 'src/shared/dto/navigate_links_dto';
import { ListDataResponse } from 'src/shared/dto/keyset_pagination_dto';

@Injectable()
export class RefundsService {
  constructor(
    private readonly transactionDao: TransactionsDAO,
    private readonly transactionService: TransactionsService,
  ) {}

  async cancelPaymentRefund(
    refund_uid: string,
    paymentUid: string,
    merchant_id: string,
    isLiveKey: boolean,
  ) {
    try {
      const refund = await this.transactionDao.deleteRefund(
        merchant_id,
        paymentUid,
        refund_uid,
        !isLiveKey,
      );
      return GetRefund.mapper(refund, paymentUid, DOCS_URLS.CANCEL_REFUND);
    } catch {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        404,
        'Not Found',
        `No payment exists with ID ${paymentUid}, or No Refund with ID ${refund_uid}`,
        { documentation },
      );
    }
  }
  async getPaymentRefund(
    refund_uid: string,
    paymentUid: string,
    merchant_id: string,
    isLiveKey: boolean,
  ) {
    const refund = await this.transactionDao.getRefund(
      merchant_id,
      paymentUid,
      refund_uid,
      !isLiveKey,
    );
    if (refund) {
      return GetRefund.mapper(refund, paymentUid);
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        404,
        'Not Found',
        `No payment exists with ID ${paymentUid}, or No Refund with ID ${refund_uid}`,
        { documentation },
      );
    }
  }
  async createPaymentRefund(
    payment_uid: any,
    data: CreateRefundDto,
    merchant_id: string,
    isLiveKey: boolean,
  ) {
    const record = new CreateRefundDto();
    record.amount = data.amount;
    record.metadata = data.metadata;
    record.description = data.description;
    const refund = await (
      await this.transactionService.requestRefund(
        merchant_id,
        payment_uid,
        record,
        !isLiveKey,
      )
    )?.data;
    if (refund) {
      return GetRefund.mapper(refund, payment_uid, DOCS_URLS.CREATE_REFUND);
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `Unable to create the refund for the payment ID ${payment_uid}`,
        { documentation },
      );
    }
  }
  async listPaymentRefunds(
    uid: string,
    merchant_id: string,
    from: string,
    limit: number,
    isLiveKey: boolean,
  ): Promise<ListDataResponse<GetPaymentRefundDto> | ApiErrorResponse> {
    const data = await this.transactionDao.getPayemntWithRefunds(
      uid,
      merchant_id,
      from,
      limit,
      !isLiveKey,
    );
    if (data) {
      //return data;
      let _embedded = [];
      for (let refund of data) {
        _embedded.push(GetRefund.mapper(refund, uid));
      }

      const previousLink = await this.transactionDao.getPreviousRefund(
        uid,
        merchant_id,
        from,
        limit,
        !isLiveKey,
      );
      const nextLink = await this.transactionDao.getNextRefund(
        uid,
        merchant_id,
        from,
        limit,
        !isLiveKey,
      );
      const currentLink = data[0]?._id;

      const self = generateNavigateLink(
        API_URLS.PAYMENTS,
        from || currentLink,
        limit,
      );
      const previous = generateNavigateLink(
        API_URLS.PAYMENTS,
        previousLink?._id,
        limit,
      );
      const next = generateNavigateLink(
        API_URLS.PAYMENTS,
        nextLink?._id,
        limit,
      );
      const documentation = new WebLinkDto(
        DOCS_URLS.LIST_PAYMENTS,
        RESPONSE_TYPE.HTML,
      );
      const _links = new ListNaviagateLinksDto(
        self,
        previous,
        next,
        documentation,
      );
      const response = new ListDataResponse<GetPaymentRefundDto>();
      response.count = data?.length;
      response._links = _links;
      response._embedded = _embedded;
      return response;
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `No payment exists with ID ${uid} or the payment has no refunds.`,
        { documentation },
      );
    }
  }
}
