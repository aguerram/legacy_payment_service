import { Schema } from "mongoose"

export const BinCodeSchema = new Schema({
    bin: {
        type: String,
        requried: true
    },
    bank: String,
    card: String,
    type: String,
    country: String,
    countrycode: String
}, {
    timestamps: true
})