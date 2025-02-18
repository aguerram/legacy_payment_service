import { ApiResponse } from 'src/shared/helpers';

import {
  Controller,
  Query,
  Body,
  Get,
  UseGuards,
  Param,
  Post,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { OwnerGuard } from 'src/auth/owner.guard';
import { CanActivateTestmodeGuard } from 'src/auth/can-activate-testmode.guard';
import { CreateCustomerDto, GetCustomersDto } from './customer.dto';
import { API_PREFIX } from 'src/shared/constants';

@Controller(`${API_PREFIX}/customers`)
export class CustomersController {
  constructor(private readonly customerService: CustomersService) {}

  /**
   * get all customers of a merchant
   * @param merchantId :string
   * @param query :string
   */
  @Get('/:merchantId')
  @UseGuards(
    JwtAuthGuard,
    new OwnerGuard('merchantId'),
    CanActivateTestmodeGuard,
  )
  async getCustomers(
    @Param('merchantId') merchantId: string,
    @Query() query: GetCustomersDto,
  ) {
    return await this.customerService.getCustomers(merchantId, query);
  }

  /**
   * create new customer
   * @param body:CreateCustomerDto
   */
  @Post('/:merchantId')
  @UseGuards(
    JwtAuthGuard,
    new OwnerGuard('merchantId'),
    CanActivateTestmodeGuard,
  )
  async add(
    @Param('merchantId') merchantId: string,
    @Body() body: CreateCustomerDto,
  ) {
    let customer = await this.customerService.getCustomerByPhone(
      body.phone,
      merchantId,
      body.testMode,
    );
    if (customer) {
      return new ApiResponse(8000, null, false);
    }

    try {
      await this.customerService.addOrUpdateCustomer({ ...body, merchantId });
      return new ApiResponse(8001);
    } catch (error) {
      return new ApiResponse(8002);
    }
  }
}
