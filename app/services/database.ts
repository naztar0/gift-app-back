import * as mongoose from 'mongoose';
import env from '#start/env';


export async function connectToDatabase() {
  await mongoose.connect(env.get('DB_CONN_URL'), {
    dbName: env.get('DB_NAME'),
    maxPoolSize: 10,
  });
}
