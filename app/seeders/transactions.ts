import { faker } from '@faker-js/faker';
import { User } from '#models/user';
import { Gift } from '#models/gift';
import { ITransaction, Transaction } from '#models/transaction';
import { TransactionStatus } from '#constants/transaction_status';


const TRANSACTIONS_COUNT = 1000;

const TransactionSeeder = async () => {
  const users = await User.find({}, '_id').exec();
  const gifts = await Gift.find({}, '_id price quantity currency').exec();

  const transactions: Partial<ITransaction>[] = Array.from({ length: TRANSACTIONS_COUNT }, () => {
    const user = faker.helpers.arrayElement(users);
    const gift = faker.helpers.arrayElement(gifts);

    return {
      user: user._id,
      gift: gift._id,
      price: gift.price,
      currency: gift.currency,
      availability: gift.quantity,
      status: TransactionStatus.Completed,
      createdAt: faker.date.recent({ days: 30 }),
    };
  });

  console.info('Seeding transactions...');

  await Transaction.insertMany(transactions);

  console.info(`Transactions created: ${TRANSACTIONS_COUNT}`);
}

export default TransactionSeeder;
