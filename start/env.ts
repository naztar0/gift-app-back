import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  STORAGE_PATH: Env.schema.string(),
  APP_TOKEN: Env.schema.string(),
  APP_URL: Env.schema.string({ format: 'url' }),
  WEB_APP_URL: Env.schema.string({ format: 'url' }),
  WEB_APP_TG_URL: Env.schema.string({ format: 'url' }),
  DB_NAME: Env.schema.string(),
  DB_CONN_URL: Env.schema.string(),
  CRYPTO_BOT_API_KEY: Env.schema.string(),
  AES_IV: Env.schema.string(),
  BOT_START_MSG_FILE_ID: Env.schema.string(),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
})
