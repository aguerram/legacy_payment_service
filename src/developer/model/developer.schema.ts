import { Schema,  Document } from "mongoose"

export const DeveloperSchema = new Schema({
    publicKey: {
        type: String,
        required: true
    },
    secretKey: {
        type: String,
        required: true
    },
    merchant_uid: {
        type:String,
        required:true,
    }
}, {
    timestamps: true
});

export interface DeveloperI extends Document {
    publicKey: string
    secretKey: string
    merchant_uid: string
    createdAt: Date
    updatedAt: Date
}