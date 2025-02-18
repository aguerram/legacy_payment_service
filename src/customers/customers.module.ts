import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DB_CUSTOMER, DB_CUSTOMER_TEST } from 'src/shared/constants';
import { CustomerSchema } from './schemas/customer.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      {
        name: DB_CUSTOMER,
        schema: CustomerSchema
      },
      //Test mode 
      {
        name: DB_CUSTOMER_TEST,
        schema: CustomerSchema
      },
    ])
  ],
  providers: [CustomersService],
  controllers: [CustomersController]
})
export class CustomersModule {}
