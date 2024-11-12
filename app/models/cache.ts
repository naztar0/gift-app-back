import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ICache {
  _id: string;
  invoicesOffset: number;
}

export const CacheSchema = new Schema<ICache>({
  _id: {
    type: String,
    required: true,
    default: 'cache',
  },
  invoicesOffset: {
    type: Number,
    required: true,
  },
});

export const Cache = mongoose.model<ICache>('Cache', CacheSchema);
