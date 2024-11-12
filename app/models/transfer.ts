import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ITransfer {
  transaction: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const TransferSchema = new Schema<ITransfer>({
  transaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
    index: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

export const Transfer = mongoose.model<ITransfer>('Transfer', TransferSchema);
