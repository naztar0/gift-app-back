import { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/core';
import { Update } from 'grammy/types';
import { bot } from '#services/bot';


export default class BotController {
  @inject()
  async handleWebhookUpdate(ctx: HttpContext) {
    await bot.handleUpdate(ctx.request.body() as unknown as Update);
  }
}
