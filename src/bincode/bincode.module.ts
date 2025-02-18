import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BinCodeSchema } from './bincode.schema';
import { BincodeService } from './bincode.service';

@Module({
  imports:[
    MongooseModule.forFeature([
      {
        name:"bincode",
        schema:BinCodeSchema
      }
    ])
  ],
  providers: [BincodeService],
  exports:[BincodeService]
})
export class BincodeModule {}
