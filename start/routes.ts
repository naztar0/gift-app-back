import router from '@adonisjs/core/services/router';
import { middleware } from '#start/kernel';
import Env from '#start/env';


const BotController = () => import('#controllers/bot_controller');
const UsersController = () => import('#controllers/users_controller');
const GiftsController = () => import('#controllers/gifts_controller');
const TransactionsController = () => import('#controllers/transactions_controller');

router
  .group(() => {  // prefix api
    router
      .group(() => {  // prefix v1
        router
          .group(() => {  // middleware auth
            router.resource('users', UsersController)
            router.resource('gifts', GiftsController)
            router.resource('transactions', TransactionsController)

            router.get('me', [UsersController, 'getMe'])
            router.put('me', [UsersController, 'updateMe'])
            router.get('me/activity', [UsersController, 'getActivity'])
            router.get('leaderboard', [UsersController, 'getLeaderboard'])
            router.get('users/:id/gifts', [UsersController, 'getGifts'])
            router.get('gifts/:id/activity', [GiftsController, 'getActivity'])
            router.post('gifts/:id/buy', [GiftsController, 'createInvoice'])
            router.post('transactions/:id/transfer', [TransactionsController, 'createTransfer'])
        })
        .use(middleware.auth())

        router.post(`payment-webhook-${Env.get('CRYPTO_BOT_API_KEY')}`, [TransactionsController, 'acceptPayment'])
        router.post(`bot-webhook-${Env.get('APP_TOKEN')}`, [BotController, 'handleWebhookUpdate'])
      })
      .prefix('v1')
  })
  .prefix('api')
