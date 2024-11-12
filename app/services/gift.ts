import * as mongoose from 'mongoose';
import { Response } from '@adonisjs/core/http';
import i18nManager from '@adonisjs/i18n/services/main';
import cba from 'crypto-bot-api';
import Env from '#start/env';
import { Gift } from '#models/gift';
import { IUser } from '#models/user';
import { Transaction } from '#models/transaction';
import { cbaClient } from '#services/crypto_bot_api';
import { TransactionStatus } from '#constants/transaction_status';


const INVOICE_EXPIRATION = 60; // 1 minute

export default class GiftService {
  async all(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    return Gift.aggregate([
      {
        $addFields: {
          isSoldOut: { $gte: ['$sold', '$quantity'] }
        }
      },
      {
        $sort: { isSoldOut: 1, createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: pageSize
      }
    ]);
  }

  async find(id: mongoose.Types.ObjectId) {
    return Gift.findById(id).exec();
  }

  private async countGiftsBlocked(giftId: mongoose.Types.ObjectId) {
    return Transaction.countDocuments({
      gift: giftId,
      status: { $in: [TransactionStatus.Pending, TransactionStatus.Completed] }
    }).exec();
  }

  async createInvoice(response: Response, user: IUser, giftId: mongoose.Types.ObjectId) {
    try {
      new mongoose.Types.ObjectId(giftId);
    } catch {
      response.abort({ message: 'Invalid gift ID' }, 400);
    }

    const gift = await Gift.findById(giftId).exec();

    if (!gift) {
      response.abort({ message: 'Gift not found' }, 404);
    }

    // Check the actual stock of the gift, including the gifts that are blocked by pending transactions
    if (await this.countGiftsBlocked(giftId) >= gift.quantity) {
      response.abort({ message: 'Gift is out of stock' }, 400);
    }

    // We book the gift for the user with a 'Pending' status,
    // if the user doesn't pay in time, we can unblock the gift setting the status to 'Expired'.,
    // if the user pays, we set the status to 'Completed'.
    // Time to pay is defined by the INVOICE_EXPIRATION (for CB-API) and TRANSACTION_EXPIRATION
    // (if the user pays, but the transaction is late)
    const transaction = new Transaction({
      user: user._id,
      gift: giftId,
      price: gift.price,
      currency: gift.currency,
      availability: gift.sold + 1,
    });

    await transaction.save();

    const i18n = i18nManager.locale(user.languageCode || i18nManager.defaultLocale);

    const invoice = await cbaClient.createInvoice({
      currencyType: cba.CurrencyType.Crypto,
      asset: gift.currency,
      amount: gift.price,
      description: i18n.t('messages.gift_invoice.message', { name: gift.name }),
      paidBtnName: 'callback',
      paidBtnUrl: `${Env.get('WEB_APP_TG_URL')}?startapp=transactions_${transaction._id}`,
      payload: {
        transaction_id: transaction._id,
      },
      expiresIn: INVOICE_EXPIRATION,
    });

    return { url: invoice.miniAppPayUrl + '&mode=compact' };
  }

  async getActivity(giftId: mongoose.Types.ObjectId, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    return Transaction.aggregate([
      {
        $match: {
          gift: new mongoose.Types.ObjectId(giftId),
          status: TransactionStatus.Completed
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'buyer'
        }
      },
      {
        $unwind: '$buyer'
      },
      {
        $addFields: { type: 'transaction' }
      },
      {
        $project: {
          _id: 1,
          gift: 1,
          user: '$buyer',
          createdAt: 1,
          type: 1,
          recipient: null // No recipient in purchases
        }
      },
      // Use $unionWith to include transfer events involving the gift
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
                'transaction.gift': new mongoose.Types.ObjectId(giftId)
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'transaction.user',
                foreignField: '_id',
                as: 'sender'
              }
            },
            {
              $unwind: '$sender'
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
              $addFields: { type: 'transfer' }
            },
            {
              $project: {
                gift: '$transaction.gift',
                sender: '$sender',
                recipient: '$recipient',
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
