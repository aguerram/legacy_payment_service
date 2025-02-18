import * as mongoose from 'mongoose';
import { ACCOUNT_ROLE, MERCHANT_ACCOUNT_STATUS } from 'src/shared/enums';
import { Account } from '../merchant.interfaces';
import * as bcrypt from 'bcrypt';
import {omit} from "lodash"
export const AccountSchema = new mongoose.Schema({
  kind: String,
  email: {
    type: String,
    unique: true,
  },
  fullName: {
    type: String,
    trim: true
  },
  pendingEmail: {
    type: String,
    trim: true
  },
  password: String,
  token: String,
  confirmedAt: Date,
  status: {
    type: MERCHANT_ACCOUNT_STATUS,
    default: MERCHANT_ACCOUNT_STATUS.PENDING
  },
  role: {
    type: ACCOUNT_ROLE,
    default: ACCOUNT_ROLE.ADMIN
  },
  phone: {
    type: String,
    trim: true
  }
}, {
  toJSON: {
    transform: (doc, ret) => {
      return omit(ret,'password','token')
    }
  }
});


AccountSchema.pre<Account>('save', function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function (err, slat) {
    if (err) return next(err);
    bcrypt.hash(user.password, slat, function (err, data) {
      user.password = data;
      return next();
    });
  });
});