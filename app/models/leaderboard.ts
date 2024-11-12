import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ILeaderboard {
  user: {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
  };
  rank: number;
  giftCount: number;
}

export const LeaderboardSchema = new Schema<ILeaderboard>({
  user: {
    _id: {
      type: String,
      required: true,
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
    photoUrl: {
      type: String,
    },
  },
  rank: {
    type: Number,
    required: true,
  },
  giftCount: {
    type: Number,
    required: true,
  },
});

export const Leaderboard = mongoose.model<ILeaderboard>('Leaderboard', LeaderboardSchema);
