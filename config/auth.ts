import { defineConfig } from '@adonisjs/auth';
import env from '#start/env';
import { telegramUserProvider } from '#auth/providers/telegram';
import { TelegramGuard } from '#auth/guards/telegram';

const telegramConfig = {
  token: env.get('APP_TOKEN'),
};

const userProvider = telegramUserProvider({
  model: () => import('#models/user'),
});

const authConfig = defineConfig({
  default: 'telegram',
  guards: {
    telegram: (ctx) => {
      return new TelegramGuard(ctx, userProvider, telegramConfig)
    },
  },
});

export default authConfig;

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
