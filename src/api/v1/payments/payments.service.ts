import { RESPONSE_ERROR_URLS } from './../../../shared/constants';
import { ApiErrorResponse } from './../../../shared/helpers';
import {
  GetPaymentDto,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentDataDto,
  CreatePaymentApplePayAPIDto,
} from './payments.dto';
import { GetPayment } from './payments.mappers';
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  QueryPaginationDto,
  WebLinkDto,
  ListNaviagateLinksDto,
} from 'src/shared/dto/navigate_links_dto';
import { generateNavigateLink } from 'src/shared/helpers';
import { DOCS_URLS, RESPONSE_TYPE, API_URLS } from 'src/shared/constants';
import { ListDataResponse } from 'src/shared/dto/keyset_pagination_dto';
import { TransactionsDAO } from 'src/transactions/transaction.dao';
import { TRANSACTION_STATUS } from 'src/shared/enums';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { DeveloperI } from 'src/developer/model/developer.schema';
import { PrivateCheckoutService } from 'src/private/private-checkout/private-checkout.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly transactionDao: TransactionsDAO,
    private readonly developerDAO: DeveloperDAO,
    private readonly privateCheckoutService: PrivateCheckoutService,
  ) {}

  async getPayment(
    merchant_id: string,
    uid: string,
    isLiveKey: boolean,
  ): Promise<GetPaymentDto | ApiErrorResponse> {
    const data = await this.transactionDao.getTransactionByUID(
      merchant_id,
      uid,
      !isLiveKey,
    );
    if (data?.payment) {
      return GetPayment.mapper(data);
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        404,
        'Not Found',
        `No payment exists with ID ${uid}.`,
        { documentation },
      );
    }
  }

  async updatePayment(
    merchant_id: string,
    uid: string,
    data: UpdatePaymentDto,
    isLiveKey: boolean,
  ): Promise<GetPaymentDto | ApiErrorResponse> {
    const payment_data = await this.transactionDao.getTransactionByUID(
      merchant_id,
      uid,
      !isLiveKey,
    );
    if (payment_data?.payment?.status !== TRANSACTION_STATUS.OPEN) {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `Can not update a processed payment.`,
        { documentation },
      );
    }
    if (payment_data?.payment) {
      const payment = payment_data.payment;
      payment.description = data.description;
      payment.redirectUrl = data.redirectUrl;
      payment.metadata = data.metadata;
      payment.locale = data.locale;
      payment.webhookUrl = data.webhookUrl;
      payment_data.payment = await payment.save();
      return GetPayment.mapper(payment_data, DOCS_URLS.UPDATE_PAYMENT);
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        404,
        'Not Found',
        `No payment exists with ID ${uid}.`,
        { documentation },
      );
    }
  }

  // async cancelPayment(merchant_id: string, uid: string, isLiveKey: boolean) {
  //   const payment = await this.transactionDao.getTransactionByUID(
  //     merchant_id,
  //     uid,
  //     !isLiveKey,
  //   );
  //   if (payment) {
  //     if (payment.status === TRANSACTION_STATUS.OPEN) {
  //       await payment.delete();
  //       return GetPayment.mapper(payment, DOCS_URLS.CANCEL_PAYMENT);
  //     } else {
  //       throw new BadRequestException({
  //         message: "Can't cancel a payment with status different to `open`",
  //       });
  //     }
  //   } else {
  //     throw new BadRequestException({ message: 'Invalid payment ID' });
  //   }
  // }

  async createPayment(
    merchant: Merchant,
    data: CreatePaymentDto,
    isLiveKey: boolean,
  ): Promise<GetPaymentDto | ApiErrorResponse> {
    const payment = await this.transactionDao.createPayment(
      merchant?._id,
      data,
      !isLiveKey,
    );

    if (payment) {
      const developer = await this.developerDAO.getDeveloperByMerchantUID(
        merchant?.uid,
        !isLiveKey,
      );
      return GetPayment.mapper(
        {
          ...payment,
          key: developer?.publicKey,
        },
        DOCS_URLS.CREATE_PAYMENT,
      );
    } else {
      const documentation = new WebLinkDto(RESPONSE_ERROR_URLS.DEFAULT);
      return new ApiErrorResponse(
        400,
        'Bad Request',
        `There was an error while creating the payment.`,
        { documentation },
      );
    }
  }

  async ListPayments(
    query: QueryPaginationDto,
    merchant_id: string,
    isLiveKey: boolean,
  ): Promise<ListDataResponse<GetPaymentDto>> {
    let { from, limit } = query || {};

    const payments = await this.transactionDao.getListPayments(
      from,
      limit,
      merchant_id,
      !isLiveKey,
    );

    const _embedded = [];
    for (let payment of payments) {
      const payment_data = new PaymentDataDto();
      payment_data.payment = payment;

      const customer = await this.transactionDao.getCustomerById(
        payment?.id,
        !isLiveKey,
      );
      if (customer) {
        payment_data.customer_uid = customer?.uid;
      }

      _embedded.push(GetPayment.mapper(payment_data));
    }

    const previousLink = await this.transactionDao.getPreviousPayment(
      from,
      limit,
      !isLiveKey,
    );
    const nextLink = await this.transactionDao.getNextPayment(
      from,
      limit,
      !isLiveKey,
    );
    const currentLink = payments[0]?._id;

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
    const next = generateNavigateLink(API_URLS.PAYMENTS, nextLink?._id, limit);
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
    const response = new ListDataResponse<GetPaymentDto>();
    response.count = payments?.length;
    response._links = _links;
    response._embedded = _embedded;

    return response;
  }

  //! this is private for apple pay developer
  async proccessApplePayPaymentAPI(
    data: CreatePaymentDto,
    isLiveKey: boolean,
    developer: DeveloperI,
    merchant: Merchant,
  ) {
    // create payment first
    const payment = await this.createPayment(merchant, data, isLiveKey);
    if (payment instanceof GetPaymentDto) {
      // send req to apple pay pay to start processing payment
      const _data = new CreatePaymentApplePayAPIDto();
      _data.paymentToken = payment?.paymentToken;
      _data.applePayPaymentToken = data?.applePayPaymentToken;
      _data.merchantUID = merchant?.uid;
      _data.key = developer.publicKey;
      _data.idenifier=data?.identifier;
      const res = await this.privateCheckoutService.proccessApplePayPaymentAPI(
        _data,
      );
      return res?.data;
    } else {
      throw new BadRequestException("Unable to process the payment")
    }
  }
}
