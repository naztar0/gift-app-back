import { faker } from '@faker-js/faker';
import { User } from '#models/user';
import { Transaction } from '#models/transaction';
import { Transfer, ITransfer } from '#models/transfer';


const TRANSFERS_COUNT = 1000;

const TransferSeeder = async () => {
  const users = await User.find({}, '_id').exec();
  const transactions = await Transaction.find({}, '_id').exec();

  const transfers: Partial<ITransfer>[] = Array.from({ length: TRANSFERS_COUNT }, () => {
    const user = faker.helpers.arrayElement(users);
    const transaction = faker.helpers.arrayElement(transactions);

    return {
      transaction: transaction._id,
      recipient: user._id,
      createdAt: faker.date.recent({ days: 30 }),
    };
  });

  console.info('Seeding transfers...');

  await Transfer.insertMany(transfers);

  console.info(`Transfers created: ${TRANSFERS_COUNT}`);
}

export default TransferSeeder;
