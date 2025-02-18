import { Document } from "mongoose"

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email: string;
  isBlacklist:boolean;
  uid:string;
  createdAt:Date;
  updatedAt:Date;
}
