import * as mongoose from 'mongoose';
import { Currency } from '#constants/currency';
import { TransactionStatus } from '#constants/transaction_status';

const Schema = mongoose.Schema;

export interface ITransaction {
  user: mongoose.Types.ObjectId;
  gift: mongoose.Types.ObjectId;
  price: number;
  currency: Currency;
  availability: number;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = new Schema<ITransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  gift: {
    type: Schema.Types.ObjectId,
    ref: 'Gift',
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: Object.values(Currency),
    required: true,
  },
  availability: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.Pending,
    index: true,
  }
}, {
  timestamps: true,
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
