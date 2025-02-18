import { ONBOARDING_STATUS, TRANSACTION_STATUS } from './../shared/enums';
import { Transaction } from 'src/transactions/transaction.interfaces';
import {
  BASE_URL,
  DB_LINK_TEST,
  DB_TRANSACTION,
  DB_TRANSACTION_TEST,
} from './../shared/constants';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PaginateModel, Types } from 'mongoose';
import { Merchant } from 'src/merchants/merchant.interfaces';
import { DB_LINK, DB_MERCHANT } from 'src/shared/constants';
import { PaginateDataTableResponse } from 'src/shared/dto/paginate_data_table_response.dto';
import { LINKS_STATUS } from 'src/shared/enums';
import {
  ApiResponse,
  generateUIDWithPrefix,
  isTestModeUID,
  isDateLessThanNow,
  getDateDiffHours,
} from 'src/shared/helpers';
import {
  CreateLinkDTO,
  GetLinksDTO,
  LinkPreviewDto,
  LinkInfoDto,
  CustomerDTO,
  CheckoutFormDto,
} from './links.dto';
import { ILink, ReusableStatus } from './links.interfaces';
import { Cron, CronExpression } from '@nestjs/schedule';
import { pick } from 'lodash';
import { WebclientService } from 'src/webclient/webclient.service';
import { DeveloperDAO } from 'src/developer/developer.dao';
import { TransactionsService } from 'src/transactions/transactions.service';
import { CreateTransactionDTO } from 'src/private/private-links/private-links.dto';
import { SettingsDAO } from 'src/merchants/settings.dao';

@Injectable()
export class LinksService {
  constructor(
    @InjectModel(DB_LINK) private linksModel: PaginateModel<ILink>,
    @InjectModel(DB_MERCHANT) private merchantModel: Model<Merchant>,
    @InjectModel(DB_TRANSACTION) private transactionModel: Model<Transaction>,

    //TEST Mode on
    @InjectModel(DB_LINK_TEST) private linksModelTest: PaginateModel<ILink>,
    @InjectModel(DB_TRANSACTION_TEST)
    private transactionModelTest: Model<Transaction>,
    private developerDAO: DeveloperDAO,
    private readonly webClient: WebclientService,
    private readonly transactionService: TransactionsService,
    private readonly settingsDAO: SettingsDAO,
  ) {}

  async getLinks(merchant: Merchant, reqQuery: GetLinksDTO) {
    let { count, from, offset, query, status, to } = reqQuery;

    const _status = status?.length > 1 ? status.split(',') : null;

    let search = {};
    if (query?.trim()?.length > 0) {
      query = query.replace('+', '');
      search = {
        $or: [
          {
            description: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            uid: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            name: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            status: {
              $regex: query,
              $options: 'i',
            },
          },
          {
            'customer.phone': {
              $regex: query,
              $options: 'i',
            },
          },
        ],
      };
    }

    const data = await this.getLinksModel(merchant?.testMode).paginate(
      {
        merchant,
        ...(_status ? { status: { $in: _status } } : {}),
        createdAt: {
          $gte: from,
          $lte: to,
        },
        ...search,
      },
      {
        select:
          'uid expiresAt reusable status amount currency name total_payments',
        sort: { createdAt: 'desc' },
        limit: Number(count),
        page: Number(offset),
      },
    );
    let statuses = await this.getLinksCountsByStatus(
      merchant,
      merchant?.testMode,
      from,
      to,
      query,
    );
    let links_data = new PaginateDataTableResponse();
    links_data.data = data.docs;
    links_data.count = data.limit;
    links_data.offset = data.offset;
    links_data.totalCounts = data.total;
    links_data.filters.statuses = statuses;
    return new ApiResponse(0, links_data);
  }

  async createLink(merchant: Merchant, body: CreateLinkDTO) {
    const uid = await this.generateUID(merchant.testMode);
    const createdBy = merchant?.accounts[0]?.fullName;
    const link = await this.getLinksModel(merchant.testMode).create({
      ...body,
      merchant,
      uid,
      createdBy,
    });

    if (
      link?.customer?.phone &&
      merchant.testMode === false &&
      body.notifyWithSms === true
    ) {
      const name = link?.customer?.name || 'there';
      try {
        const res = await this.webClient.getSmsCall().get('', {
          params: {
            smsText: `Hi ${name},\nA payment request from ${merchant?.organization?.legalName} for ${link?.amount} ${link?.currency} \ncan be paid online at ${process.env.FRONT_URL}/pay/${uid}`,
            recipientPhone: link?.customer?.phone,
          },
        });
        if (res?.data?.d?.IsSuccess) {
          link.sms_log.last_time_sent = new Date();
          link.sms_log.number_sms_sent++;
          await link.save();
        }
      } catch (error) {
        console.log(error);
      }
    }
    return new ApiResponse(3000);
  }

  async getLinkInfo(uid: string) {
    const link = await this.getLinkByUID(uid);
    const transactions = await this.getTransactionModel(isTestModeUID(uid))
      .find(
        { linkUID: uid, status: { $ne: TRANSACTION_STATUS.OPEN } },
        { uid: 1, amount: 1, createdAt: 1, status: 1, currency: 1 },
      )
      .sort({ createdAt: 'desc' })
      .limit(5);

    // dont send sms log
    const {
      amount,
      currency,
      description,
      name,
      reusable,
      status,
      expiresAt,
      custom_fields,
      customer,
      createdAt,
      total_payments,
    } = link;
    const data: LinkInfoDto = {
      uid,
      amount,
      currency,
      description,
      name,
      reusable: reusable ? ReusableStatus.Open : ReusableStatus.SingleUse,
      status,
      expiresAt,
      testMode: isTestModeUID(uid),
      custom_fields,
      customer,
      transactions,
      total_payments,
      createdAt,
      canResendSms: this.canResendSms(link),
    };
    return new ApiResponse(0, data);
  }

  private canResendSms(link: ILink) {
    if (link?.sms_log?.last_time_sent) {
      return (
        !isTestModeUID(link.uid) &&
        link?.customer?.phone &&
        link?.status !== LINKS_STATUS.EXPIRED &&
        getDateDiffHours(link.sms_log.last_time_sent) >= 24 &&
        link?.status !== LINKS_STATUS.PAID
      );
    } else {
      return (
        !isTestModeUID(link.uid) &&
        link?.customer?.phone &&
        link?.status !== LINKS_STATUS.EXPIRED &&
        link?.status !== LINKS_STATUS.PAID
      );
    }
  }

  async markLinkAsExpired(linkUID: string) {
    let link = await this.getLinkByUID(linkUID);
    link.status = LINKS_STATUS.EXPIRED;
    link.expiresAt = new Date();
    await link.save();
    return new ApiResponse(3001);
  }

  async resendSmsMessage(linkUID: string, merchant: Merchant) {
    let link = await this.getLinkByUID(linkUID);

    if (this.canResendSms(link)) {
      try {
        const name = link?.customer?.name || 'there';
        const res = await this.webClient.getSmsCall().get('', {
          params: {
            smsText: `Hi ${name},\nA payment request from ${merchant?.organization?.legalName} for ${link?.amount} ${link?.currency} \ncan be paid online at ${process.env.FRONT_URL}/pay/${linkUID}`,
            recipientPhone: link?.customer?.phone,
          },
        });

        if (res?.data?.d?.IsSuccess) {
          link.sms_log.number_sms_sent++;
          link.sms_log.last_time_sent = new Date();
          await link?.save();
          return new ApiResponse(3002, null, true);
        } else {
          return new ApiResponse(3003, null, false);
        }
      } catch (error) {
        return new ApiResponse(3003, null, false);
      }
    } else {
      return new ApiResponse(3004, null, false);
    }
  }

  private async getLinksCountsByStatus(
    merchant: Merchant,
    testMode: boolean,
    from,
    to,
    query,
  ) {
    let aggregatorOpts = [
      {
        $match: {
          merchant: Types.ObjectId(merchant._id),
          createdAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          hasResult: { $cond: [{ $gt: ['$count', 0] }, true, false] },
        },
      },
    ];

    const data = await this.getLinksModel(testMode)
      .aggregate(aggregatorOpts)
      .exec();

    return data;
  }

  public async getMerchant(merchantId: string) {
    return await this.merchantModel.findById({ _id: merchantId });
  }

  async getLinkInforPreview(uid: string) {
    const isTestMode = isTestModeUID(uid);
    let link = await this.getLinkByUID(uid);
    const merchant = await await this.getMerchantSettings(link?.merchant._id);
    const settings = merchant.settings;

    const checkoutLogo = settings?.checkout?.logo?.path;
    const checkoutButtonColor = settings?.checkout?.buttonColor;

    const activeMethods = await this.settingsDAO.getMerchantActiveMethodsLive(
      null,
      merchant,
      isTestMode,
    );

    const merchantMapped = merchant?.organization?.legalName;
    const developer = await this.developerDAO.getDeveloperByMerchantUID(
      merchant.uid,
      isTestModeUID(uid),
    );
    let linkPreview: LinkPreviewDto = {
      methods: activeMethods || {},
      link: {
        amount: link.amount,
        currency: link.currency,
        customerLocale: link.customerLocale,
        description: link.description,
        expiresAt: link.expiresAt,
        merchant: merchantMapped,
        name: link.name,
        redirectUrl: link.redirectUrl,
        reusable: link.reusable
          ? ReusableStatus.Open
          : ReusableStatus.SingleUse,
        status: link.status,
        testMode: isTestModeUID(uid),
        uid: link.uid,
        customer: pick(link.customer, ['name', 'email', 'phone']),
        custom_fields: link.custom_fields,
        paid: link.status === LINKS_STATUS.PAID && !link.reusable,
        pkey: developer?.publicKey,
      },
      checkoutLogo,
      checkoutButtonColor,
    };
    if (
      link.status === LINKS_STATUS.EXPIRED ||
      (link.status === LINKS_STATUS.PAID && !link.reusable)
    ) {
      linkPreview.link.amount = 0;
    }

    return new ApiResponse(0, linkPreview);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiresLinks() {
    try {
      //check production links
      const links = await this.linksModel
        .find(
          { status: { $eq: LINKS_STATUS.PENDING } },
          { _id: 1, status: 1, expiresAt: 1 },
        )
        .populate({
          path: 'merchant',
          model: DB_MERCHANT,
          select: { _id: 1, onboarding: 1 },
        });

      links.forEach(async (link) => {
        const isExpiredByTime = isDateLessThanNow(link?.expiresAt);

        // check if the owner of link is in test account and the link on prod mode
        // check also if the link is really expired by time
        if (
          link?.merchant?.onboarding?.status !== ONBOARDING_STATUS.COMPLETED ||
          isExpiredByTime
        ) {
          link.status = LINKS_STATUS.EXPIRED;
          link.expiresAt = new Date();
        }
        await link.save();
      });

      //check test links
      const expiredLinksTest = await this.linksModelTest.find(
        {
          expiresAt: { $lt: new Date() },
          status: { $eq: LINKS_STATUS.PENDING },
        },
        { _id: 1, status: 1 },
      );
      expiredLinksTest.forEach(async (link) => {
        link.status = LINKS_STATUS.EXPIRED;
        await link.save();
      });
    } catch (err) {
      console.log(err);
    }
  }

  async createPaymentForLink(linkUID: string, data: CheckoutFormDto) {
    const isTest = isTestModeUID(linkUID);
    const linksModel = this.getLinksModel(isTest);
    const link = await linksModel.findOne({ uid: linkUID });
    if (!link) {
      throw new NotFoundException();
    }
    if (
      (link.status === LINKS_STATUS.PAID && !link.reusable) ||
      link.status === LINKS_STATUS.EXPIRED
    ) {
      throw new BadRequestException({
        message: 'Can not create new payment for this link.',
      });
    }
    const merchant = await this.merchantModel.findById(link.merchant);
    if (!merchant) throw new NotFoundException();
    const transactionDTO = new CreateTransactionDTO();
    transactionDTO.currency = link.currency;
    transactionDTO.amount = link.amount;
    transactionDTO.description = link.name;
    transactionDTO.linkUID = link.uid;
    transactionDTO.merchant_uid = merchant.uid;
    transactionDTO.createdBy = link?.createdBy;
    transactionDTO.testMode = isTest;
    transactionDTO.customer = {
      email: data.email,
      name: data.name,
      phone: data.phone,
    };
    transactionDTO.custom_fields = data.custom_fields;
    transactionDTO.redirectUrl = link.redirectUrl;
    transactionDTO.webhookUrl =
      link.webhookUrl ||
      `${BASE_URL}/webhook/payment/${merchant.uid}?testMode=${isTest}`;
    const payment = await this.transactionService.createPayment(transactionDTO);

    return new ApiResponse(0, payment.paymentToken, !!payment);
  }

  private async getMerchantSettings(merchantId: string) {
    return await this.merchantModel
      .findById({ _id: merchantId })
      .populate('settings');
  }

  async getLinkByUID(uid: string) {
    return await this.getLinksModel(isTestModeUID(uid)).findOne({
      uid,
    });
  }

  async changeLinkStatusToPaid(uid: string) {
    const link = await this.getLinkByUID(uid);
    if (link.status === LINKS_STATUS.PENDING) {
      link.status = LINKS_STATUS.PAID;
      if (link.reusable) {
        link.total_payments++;
      }
      await link.save();
    }
  }

  async generateUID(testMode = true) {
    let uid = null;
    while (uid == null) {
      let _uid = generateUIDWithPrefix('pl', testMode);
      let link = await this.getLinkByUID(_uid);
      if (!link) {
        uid = _uid;
      }
    }
    return uid;
  }

  public getLinksModel(testMode = true): PaginateModel<ILink> {
    return !testMode ? this.linksModel : this.linksModelTest;
  }

  public getTransactionModel(testMode = true): Model<Transaction> {
    return !testMode ? this.transactionModel : this.transactionModelTest;
  }
}
