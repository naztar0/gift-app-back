import * as mongoose from 'mongoose';
import i18nManager from '@adonisjs/i18n/services/main';
import { Response } from '@adonisjs/core/http';
import { Invoice } from 'crypto-bot-api';
import env from '#start/env';
import { ITransaction, Transaction } from '#models/transaction';
import { IGift, Gift } from '#models/gift';
import { Transfer } from '#models/transfer';
import { IUser } from '#models/user';
import { cbaClient } from '#services/crypto_bot_api';
import { bot } from '#services/bot';
import { TransactionStatus } from '#constants/transaction_status';
import { decrypt } from '#utils/encryption';


export default class TransactionService {
  async find(response: Response, id: mongoose.Types.ObjectId) {
    try {
      new mongoose.Types.ObjectId(id);
    } catch {
      response.abort({ message: 'Invalid transaction ID' }, 400);
    }
    return Transaction.findById(id).populate('gift').exec();
  }

  async userTransactions(userId: mongoose.Types.ObjectId, page: number, pageSize: number) {
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
          from: 'transfers',
          localField: '_id',
          foreignField: 'transaction',
          as: 'transfer'
        }
      },
      {
        $match: {
          transfer: { $size: 0 }
        }
      },
      {
        $project: {
          transfer: 0
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
          from: 'gifts',
          localField: 'gift',
          foreignField: '_id',
          as: 'gift'
        }
      },
      {
        $unwind: '$gift'
      }
    ]);
  }

  async acceptPayment(body: any, headers: any) {
    cbaClient.middleware()({ body, headers }, { statusCode: 200, 'end': () => {} });
  }

  static async handlePayment(invoice?: Invoice) {
    const transaction = await Transaction.findById(invoice?.payload.transaction_id)
      .populate('user')
      .populate('gift')
      .exec();

    if (!transaction) {
      console.error('Transaction not found:', invoice?.payload.transaction_id);
      return;
    }

    if (transaction.status === TransactionStatus.Completed) {
      console.warn('Transaction already completed:', invoice?.payload.transaction_id);
      return;
    }

    transaction.status = TransactionStatus.Completed;
    await transaction.save();

    await Gift.findByIdAndUpdate(transaction.gift, { $inc: { sold: 1 } }).exec();
    const user = transaction.user as unknown as IUser;
    const gift = transaction.gift as unknown as IGift;

    const i18n = i18nManager.locale(user.languageCode || i18nManager.defaultLocale);

    bot.api.sendMessage(
      user.telegramId,
      i18n.t('messages.purchased_gift.message', { name: gift.name }),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: i18n.t('messages.purchased_gift.button'),
              web_app: {
                url: `${env.get('WEB_APP_URL')}?tgWebAppStartParam=gifts`,
              },
            },
          ]],
        },
      },
    ).catch((reason) => {
      console.error('Failed to send a message:', reason);
    });
  }

  private async getTransferFull(transactionId: mongoose.Types.ObjectId) {
    return Transfer
      .findOne({ transaction: transactionId })
      .populate({ path: 'transaction', populate: { path: 'gift' } })
      .populate({ path: 'transaction', populate: { path: 'user' } })
      .exec();
  }

  async createTransfer(response: Response, transactionEncryptedId: string, user: mongoose.HydratedDocument<IUser>) {
    let transactionId: string;

    try {
      transactionId = decrypt(transactionEncryptedId);
      new mongoose.Types.ObjectId(transactionId);
    } catch {
      response.abort({ message: 'Invalid transaction ID' }, 400);
    }

    const transactions = await Transaction.aggregate<ITransaction>([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(transactionId),
        }
      },
      {
        $lookup: {
          from: 'transfers',
          localField: '_id',
          foreignField: 'transaction',
          as: 'transfer'
        }
      },
      {
        $match: {
          transfer: { $size: 0 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
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
      }
    ]);

    const transaction = transactions[0];

    if (!transaction) {
      const transfer = await this.getTransferFull(new mongoose.Types.ObjectId(transactionId));
      if (transfer) {
        return transfer;
      }
      response.abort({ message: 'Transaction not found' }, 404);
    }
    if (transaction.status !== TransactionStatus.Completed) {
      response.abort({ message: 'Transaction is not completed' }, 400);
    }

    const transfer = new Transfer({
      transaction: transactionId,
      recipient: user._id,
    });

    await transfer.save();
    const sender = transaction.user as unknown as IUser;
    const gift = transaction.gift as unknown as IGift;

    const i18n = i18nManager.locale(sender.languageCode || i18nManager.defaultLocale);

    bot.api.sendMessage(
      sender.telegramId,
      i18n.t('messages.received_gift.message', { name: gift.name, fullName: `${user.firstName} ${user.lastName}`.trim() }),
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: i18n.t('messages.received_gift.button'),
              web_app: {
                url: `${env.get('WEB_APP_URL')}`,
              },
            },
          ]],
        },
      },
    ).catch((reason) => {
      console.error('Failed to send a message:', reason);
    });

    return this.getTransferFull(new mongoose.Types.ObjectId(transactionId));
  }
}
