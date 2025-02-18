import { Document } from "mongoose"
import { Merchant } from "src/merchants/merchant.interfaces";
import {  SETTLEMENT_STATUS } from "src/shared/enums";

export interface IBalance extends Document {
    uid: string
    amount: number
    currency: string
    reference:string
    description: string
    name: string
    merchant: Merchant,
    reusable: boolean
    expiresAt: Date
    customerLocale: string
    testMode: boolean
    customer?: ICustomer,
    status:SETTLEMENT_STATUS,
    amount_net:number,
    createdAt:Date,
    settledAt:Date,
    updatedAt:Date,
    fees:number,
}

export interface ICustomer extends Document {
    name: string
    email: string
    phone: string
    metadata: object
}

export enum ReusableStatus {
    Open = "Open",
    SingleUse = "Single use"
}