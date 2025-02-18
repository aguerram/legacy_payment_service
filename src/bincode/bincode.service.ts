import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import { Model } from 'mongoose';
import { BinCodeDocumentI, BinCodeI } from './bincode.interface';
@Injectable()
export class BincodeService {

    private logger: Logger = new Logger(BincodeService.name)

    private call: AxiosInstance
    constructor(
        @InjectModel("bincode")
        private readonly binCodeModel: Model<BinCodeDocumentI>
    ) {
        this.call = axios.create({
            baseURL: `${process.env.BINCODES_API_BASEURL}/${process.env.BINCODES_API_KEY}`
        })
    }

    async binLookup(binCode: string): Promise<BinCodeDocumentI | BinCodeI> {
        try {
            //let's check fist of we already have the bin stored in our cache
        this.logger.verbose(`Trying to get info for bin ${binCode}`)
        const bin = await this.binCodeModel.findOne({ bin: binCode })
        if (bin) {
            this.logger.log(`${binCode} already exists in cache, returning it ...`)
            //this bin already exists            
            return bin
        }
        //this bin is new or very old we have to retrive it and store it
        const { data } = await this.call.get(`/${binCode}`)
        this.logger.warn(`Bin ${binCode} deson't exist, fetching it from bincodes...`)

        if (!data.valid) {
            this.logger.error(`faild to get bin ${binCode}`)
            //TODO find a new way to handle this
            const fake: BinCodeI = {
                bank: "",
                bin: binCode,
                card: "",
                country: "",
                countrycode: "",
                type: "",
                createdAt: new Date(),
                updatedAt: new Date()
            }
            return fake;
        }
        this.logger.verbose(`bin ${binCode} does exist, saving it in database then returning it.`)

        const created = await this.binCodeModel.create({
            ...data
        })
        this.logger.log(`New bin saved to cache : ${JSON.stringify(created)}`)
        return created;
        } catch (error) {
            console.log(error)
            this.logger.log(`No info found about this bin: ${binCode}`)
            throw new NotFoundException("No info found about this bin.");
            
        }
    }
}
