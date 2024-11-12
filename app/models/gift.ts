import * as mongoose from 'mongoose';
import { Currency } from '#constants/currency';

const Schema = mongoose.Schema;

interface IAnimationSequence {
  direction: 1 | -1;
}

export interface IGift {
  name: string;
  previewUrl: string;
  animationUrl: string;
  animationSequence: IAnimationSequence[];
  color: string;
  quantity: number;
  price: number;
  currency: Currency;
  sold: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnimationSequenceSchema = new Schema<IAnimationSequence>({
  direction: {
    type: Number,
    enum: [1, -1],
    required: true,
  },
}, {
  _id: false,
});

export const GiftSchema = new Schema<IGift>({
  name: {
    type: String,
    required: true,
    index: true,
  },
  previewUrl: {
    type: String,
    required: true,
  },
  animationUrl: {
    type: String,
    required: true,
  },
  animationSequence: {
    type: [AnimationSequenceSchema],
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
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
  sold: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export const Gift = mongoose.model<IGift>('Gift', GiftSchema);
