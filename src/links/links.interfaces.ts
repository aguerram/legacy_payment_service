import { Document } from "mongoose"
import { Merchant } from "src/merchants/merchant.interfaces";
import { LINKS_STATUS } from "src/shared/enums";

export interface ILink extends Document {
    uid: string
    amount: number
    currency: string
    description: string
    name: string
    merchant: Merchant,
    reusable: boolean
    expiresAt: Date
    customerLocale: string
    redirectUrl: string,
    webhookUrl: string,
    customer?: ICustomer,
    status:LINKS_STATUS,
    notifyWithSms:boolean,
    sms_log:SmsLog,
    custom_fields:IcustomField[],
    createdAt:Date,
    updatedAt:Date,
    total_payments:number,
    createdBy:string,

}

export interface ICustomer extends Document {
    name: string
    email: string
    phone: string
    metadata: object
}

export interface  IcustomField {
    name: string
    label: string
    value: string
}

export interface  SmsLog {
    last_time_sent: Date
    number_sms_sent: number
}

export enum ReusableStatus {
    Open = "Open",
    SingleUse = "Single use"
}