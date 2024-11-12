import { connectToDatabase } from '#services/database';
import GiftSeeder from './gifts.js';
import UserSeeder from './users.js';
import TransactionSeeder from './transactions.js';
import TransferSeeder from './transfers.js';


(async () => {
  await connectToDatabase();
  await GiftSeeder();
  await UserSeeder();
  await TransactionSeeder();
  await TransferSeeder();
  process.exit(0);
})();
