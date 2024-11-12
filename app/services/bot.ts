import { Bot, Context } from 'grammy';
import { FileFlavor, hydrateFiles } from '@grammyjs/files';
import i18nManager from '@adonisjs/i18n/services/main'
import mongoose from 'mongoose';
import env from '#start/env';
import { User } from '#models/user';
import { Transaction } from '#models/transaction';
import { IGift } from '#models/gift';
import { encrypt } from '#utils/encryption';
import { updateUserPhoto } from '#utils/telegram';


type BotContext = FileFlavor<Context>;

export const bot = new Bot<BotContext>(env.get('APP_TOKEN'));

bot.api.config.use(hydrateFiles(bot.token));

bot.init().then(() => {
  console.info('Bot started');
});

bot.command('start', async (ctx) => {
  if (!ctx.from) {
    return;
  }

  const i18n = i18nManager.locale(ctx.from.language_code || i18nManager.defaultLocale);

  const user = await User.findOne({ telegramId: ctx.from.id }).exec();
  if (!user) {
    await new User({
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name || '',
      languageCode: ctx.from.language_code,
      isPremium: ctx.from.is_premium || false,
    }).save();
  } else {
    user.username = ctx.from.username;
    user.firstName = ctx.from.first_name;
    user.lastName = ctx.from.last_name || '';
    user.languageCode = ctx.from.language_code;
    user.isPremium = ctx.from.is_premium || false;
    await user.save();
  }
  if (!user?.photoUrl) {
    updateUserPhoto(ctx.from.id).catch();
  }

  ctx.api.sendPhoto(ctx.chat.id, env.get('BOT_START_MSG_FILE_ID'), {
    caption: i18n.t('messages.start.message'),
    reply_markup: {
      inline_keyboard: [[
        {
          text: i18n.t('messages.start.button'),
          web_app: {
            url: env.get('WEB_APP_URL'),
          },
        },
      ]],
    },
  }).catch();
});

bot.on('inline_query', async (ctx) => {
  if (!ctx.inlineQuery.query) {
    return;
  }

  try {
    new mongoose.Types.ObjectId(ctx.inlineQuery.query);
  } catch {
    return;
  }

  const transactions = await Transaction.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(ctx.inlineQuery.query) }
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
      $match: { 'user.telegramId': ctx.inlineQuery.from.id }
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
  ]);

  const transaction = transactions[0];

  if (!transaction) {
    return;
  }

  const i18n = i18nManager.locale(ctx.inlineQuery.from.language_code || i18nManager.defaultLocale);

  await ctx.answerInlineQuery([
    {
      type: 'article',
      id: transaction._id.toString(),
      title: i18n.t('messages.send_gift.title'),
      description: i18n.t('messages.send_gift.subtitle', { name: (transaction.gift as unknown as IGift).name }),
      input_message_content: {
        message_text: i18n.t('messages.send_gift.message'),
        parse_mode: 'HTML',
      },
      reply_markup: {
        inline_keyboard: [[
          {
            text: i18n.t('messages.send_gift.button'),
            url: `${env.get('WEB_APP_TG_URL')}?startapp=receive_${encrypt(transaction._id.toString())}`,
          },
        ]],
      },
      thumbnail_url: `${env.get('APP_URL')}/images/avatar.png`,
    },
  ], {
    is_personal: true,
    cache_time: 0,
  });
});

bot.on('chosen_inline_result', async (_ctx) => {
  // can't get the recipient's telegram id ＞﹏＜
});
