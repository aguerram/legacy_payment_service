import { Injectable } from '@nestjs/common';
import { TransactionsService } from '../transactions.service';
import { CustomersService } from 'src/customers/customers.service';
import { Parser, Transform } from 'json2csv';
import { Response } from 'express';
import { PaymentSettingsDto } from '../transaction.dto';
import { ApiResponse, formatAmount, ucFirst } from 'src/shared/helpers';
import * as moment from 'moment';
import countries from 'src/shared/data/countries';
import currency from 'src/shared/data/currencies';
@Injectable()
export class ExportService {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly customerService: CustomersService,
  ) {}

  async exportToCSV(res: Response, dto: PaymentSettingsDto) {
    dto.offset = 1;
    dto.count = 1000;

    const { data } = await this.transactionsService.getMerchantTransactions(
      dto,
    );

    for (let index = 0; index < data.data.length; index++) {
      const _transaction = data.data[index];
      if (_transaction?.customer_id) {
        const customer = await this.customerService.getCustomerByID(
          _transaction.customer_id,
          dto.testMode,
        );
        if (customer) {
          data.data[index].customer = customer
        }
      }
      if(!data.data[index].customer){
        data.data[index].customer = {
          name:"-",
          phone:"-",
          email:"-"
        };
      }
    }
    return this.downloadResource(
      res,
      `transactions_${dto.merchant}_${Date.now()}.csv`,
      [
        {
          value: 'uid',
          label: 'UID',
        },
        {
          value: (row) => row.customer?.name,
          label: 'Customer name',
        },
        {
          value: (row) => row.customer?.phone,
          label: 'Phone number',
        },
        {
          value: (row) => row.customer?.email,
          label: 'Email',
        },
        {
          value: 'description',
          label: 'Description',
        },
        {
          value: (row) =>
            formatAmount(row.amount, currency[row.currency]?.symbol || 'QAR'),
          label: 'Amount (QAR)',
        },
        {
          value: (row) =>
            formatAmount(row.fees, currency[row.currency]?.symbol || 'QAR'),
          label: 'Fees (QAR)',
        },
        {
          value: (row) =>
            formatAmount(
              row.amount_net,
              currency[row.currency]?.symbol || 'QAR',
            ),
          label: 'Net Amount (QAR)',
        },
        {
          value: (row) =>
            formatAmount(
              row.amountRefunded,
              currency[row.currency]?.symbol || 'QAR',
            ),
          label: 'Amount Refunded (QAR)',
        },
        {
          value: (row, field) => ucFirst(row.status),
          label: 'Status',
        },
        {
          value: (row) => countries[row.countryCode],
          label: 'Country',
        },
        // {
        //   label: 'Card holder',
        //   value: 'lastCharge.methodDetails.cardHolder',
        // },
        {
          label: 'Card brand',
          value: 'lastCharge.methodDetails.cardBrand',
        },
        {
          label: 'Transaction method',
          value: (row) => String(row.lastCharge?.method).toUpperCase(),
        },
        {
          value: (row) => moment(row.createdAt).format('YYYY-MM-DD hh:mm:ss'),
          label: 'Date',
        },
        {
          value: "createdBy",
          label: 'Created by',
        },
        {
          value: "payoutId",
          label: 'Settlement reference',
        },
      ],
      data.data,
    );
  }

  downloadResource(
    res: Response,
    fileName: string,
    fields: {
      label: string;
      value: any;
    }[],
    data: [any],
  ) {
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    return res.send(csv);
  }
}
