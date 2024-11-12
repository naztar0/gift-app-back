import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IUser {
  _id: mongoose.Types.ObjectId;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
  isPremium: boolean;
  isBanned: boolean;
  rank: number;
  giftCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>({
  telegramId: {
    type: Number,
    required: true,
    index: true,
    unique: true,
  },
  username: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  languageCode: {
    type: String,
  },
  photoUrl: {
    type: String,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  rank: {
    type: Number,
    default: 0,
  },
  giftCount: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

export const User = mongoose.model<IUser>('User', UserSchema);

export default User;
