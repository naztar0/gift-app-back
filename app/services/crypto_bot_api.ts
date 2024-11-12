import ClientEmitter from 'crypto-bot-api';
import type { ClientEmitter as CE } from 'crypto-bot-api';
import env from '#start/env';
import Transaction from '#services/transaction';

export const cbaClient = new (ClientEmitter as unknown as typeof CE)(env.get('CRYPTO_BOT_API_KEY'), 'testnet');

// Signature checks in the middleware, so no need to check it manually
cbaClient.on('paid', async (invoice) => {
  await Transaction.handlePayment(invoice);
})
