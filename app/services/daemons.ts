import { GetInvoicesStatus } from 'crypto-bot-api';
import { Cache } from '#models/cache';
import { Transaction } from '#models/transaction';
import { Transfer } from '#models/transfer';
import { User } from '#models/user';
import { cbaClient } from '#services/crypto_bot_api';
import TransactionService from '#services/transaction';
import { TransactionStatus } from '#constants/transaction_status';


const TRANSACTION_EXPIRATION = 60 * 5 * 1e3; // 5 minutes
const LEADERBOARD_CHUNK_SIZE = 1000;

export const checkInvoices = async () => {
  let cache = await Cache.findById('cache').exec();
  if (!cache) {
    cache = new Cache({ _id: 'cache' });
  }
  let offset = cache.invoicesOffset || 0;
  const invoices = await cbaClient.getInvoices({ status: 'paid' as GetInvoicesStatus, offset });

  for (const invoice of invoices) {
    await TransactionService.handlePayment(invoice);
    offset++;
  }

  cache.invoicesOffset = offset;
  await cache.save();
}

export const invalidateExpiredTransactions = async () => {
  await Transaction.updateMany({
    status: TransactionStatus.Pending,
    createdAt: { $lt: new Date(Date.now() - TRANSACTION_EXPIRATION) },
  }, {
    status: TransactionStatus.Expired,
  });
}

export const updateLeaderboard = async () => {
  const usersCount = await User.countDocuments().exec();

  for (let i = 0; i < usersCount; i += LEADERBOARD_CHUNK_SIZE) {
    const result = await Transfer.aggregate([
      // Group by recipient and count the number of gifts received
      {
        $group: {
          _id: '$recipient',
          giftCount: { $sum: 1 }
        }
      },
      {
        $sort: { giftCount: -1 }
      },
      {
        $skip: i
      },
      {
        $limit: LEADERBOARD_CHUNK_SIZE
      },
    ]);

    const bulk = User.collection.initializeUnorderedBulkOp();
    for (let j = 0; j < result.length; j++) {
      bulk.find({ _id: result[j]._id }).updateOne({
        $set: {
          rank: i + j + 1,
          giftCount: result[j].giftCount
        }
      });
    }
    await bulk.execute();
  }
}
