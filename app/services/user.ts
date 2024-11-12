import mongoose from 'mongoose';
import { HttpContext, Response } from '@adonisjs/core/http';
import { Transfer } from '#models/transfer';
import { Transaction } from '#models/transaction';
import { User } from '#models/user';
import { TransactionStatus } from '#constants/transaction_status';


export default class UserService {
  async find(response: Response, id: mongoose.Types.ObjectId) {
    try {
      new mongoose.Types.ObjectId(id);
    } catch {
      return response.abort({ message: 'Invalid user ID' }, 400);
    }

    // Recalculate user rankings when fetching a specific user
    // to provide the most up-to-date data
    const user = await User.aggregate([
      {
        $lookup: {
          from: 'transfers',
          localField: '_id',
          foreignField: 'recipient',
          as: 'receivedTransfers',
        },
      },
      {
        $addFields: {
          giftCount: { $size: '$receivedTransfers' },
        },
      },
      {
        $sort: { giftCount: -1 },
      },
      // Group all users into an array to assign rankings
      {
        $group: {
          _id: null,
          users: {
            $push: {
              user: '$$ROOT',
              giftCount: '$giftCount',
            },
          },
        },
      },
      {
        $unwind: {
          path: '$users',
          includeArrayIndex: 'rank',
        },
      },
      {
        $match: {
          'users.user._id': new mongoose.Types.ObjectId(id),
        },
      },
      {
        $project: {
          _id: '$users.user._id',
          telegramId: '$users.user.telegramId',
          username: '$users.user.username',
          firstName: '$users.user.firstName',
          lastName: '$users.user.lastName',
          languageCode: '$users.user.languageCode',
          isPremium: '$users.user.isPremium',
          photoUrl: '$users.user.photoUrl',
          giftCount: '$users.giftCount',
          rank: { $add: ['$rank', 1] }, // Rankings start from 1
        },
      },
    ]);
    return user[0];
  }

  async update(ctx: HttpContext) {
    if (!ctx.auth.user) {
      ctx.response.abort({ message: 'User not found' }, 404);
    }

    const data = ctx.request.only([
      'username',
      'firstName',
      'lastName',
      'languageCode',
      'isPremium',
    ]);

    return User.findByIdAndUpdate(ctx.auth.user._id, data).exec();
  }

  async getLeaderboard(page: number, pageSize: number, search: string) {
    const skip = (page - 1) * pageSize;

    return User.aggregate([
      {
        $match: {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
          ],
          rank: { $gt: 0 }
        }
      },
      {
        $sort: { rank: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: pageSize
      },
      {
        $project: {
          _id: 1,
          telegramId: 1,
          rank: 1,
          giftCount: 1,
          firstName: 1,
          lastName: 1,
          photoUrl: 1,
          isPremium: 1
        }
      },
    ]);
  }

  async profileGifts(response: Response, userId: mongoose.Types.ObjectId, page: number, pageSize: number) {
    try {
      new mongoose.Types.ObjectId(userId);
    } catch {
      return response.abort({ message: 'Invalid user ID' }, 400);
    }

    const skip = (page - 1) * pageSize;

    return Transfer.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $skip: skip
      },
      {
        $limit: pageSize
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $lookup: {
          from: 'transactions',
          localField: 'transaction',
          foreignField: '_id',
          as: 'transaction'
        }
      },
      {
        $unwind: '$transaction'
      },
      {
        $lookup: {
          from: 'gifts',
          localField: 'transaction.gift',
          foreignField: '_id',
          as: 'transaction.gift'
        }
      },
      {
        $unwind: '$transaction.gift'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'transaction.user',
          foreignField: '_id',
          as: 'transaction.user'
        }
      },
      {
        $unwind: '$transaction.user'
      }
    ]);
  }

  async activityHistory(userId: mongoose.Types.ObjectId, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    return Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: TransactionStatus.Completed
        }
      },
      {
        $lookup: {
          from: 'gifts',
          localField: 'gift',
          foreignField: '_id',
          as: 'gift'
        }
      },
      {
        $unwind: '$gift'
      },
      // Add a 'type' field to indicate the event type
      {
        $addFields: { type: 'transaction' }
      },
      {
        $project: {
          _id: 1,
          user: null, // User is always the same as the userId
          recipient: null, // No recipient in transactions
          gift: 1,
          createdAt: 1,
          type: 1
        }
      },
      // Use $unionWith to include transfers involving the user
      {
        $unionWith: {
          coll: 'transfers',
          pipeline: [
            {
              $lookup: {
                from: 'transactions',
                localField: 'transaction',
                foreignField: '_id',
                as: 'transaction'
              }
            },
            {
              $unwind: '$transaction'
            },
            {
              $match: {
                $or: [
                  { recipient: new mongoose.Types.ObjectId(userId) },
                  { 'transaction.user': new mongoose.Types.ObjectId(userId) }
                ]
              }
            },
            {
              $lookup: {
                from: 'gifts',
                localField: 'transaction.gift',
                foreignField: '_id',
                as: 'gift'
              }
            },
            {
              $unwind: '$gift'
            },
            // Add a 'type' field to indicate the event type
            {
              $addFields: { type: 'transfer' }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'transaction.user',
                foreignField: '_id',
                as: 'transaction.user'
              }
            },
            {
              $unwind: '$transaction.user'
            },
            {
              $lookup: {
                from: 'users',
                localField: 'recipient',
                foreignField: '_id',
                as: 'recipient'
              }
            },
            {
              $unwind: '$recipient'
            },
            {
              $project: {
                _id: 1,
                sender: '$transaction.user',
                recipient: '$recipient',
                gift: 1,
                createdAt: 1,
                type: 1
              }
            }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: pageSize
      }
    ]);
  }
}
