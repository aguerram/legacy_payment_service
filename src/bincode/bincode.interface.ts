import { Document } from "mongoose"
export interface BinCodeDocumentI extends Document {
    bin: string
    bank: string
    card: string
    type: string
    country: string
    countrycode: string

    createdAt: Date
    updatedAt: Date
}

export interface BinCodeI {
    bin: string
    bank: string
    card: string
    type: string
    country: string
    countrycode: string

    createdAt: Date
    updatedAt: Date
}