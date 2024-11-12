import * as crypto from 'node:crypto';
import env from '#start/env';
import { bot } from '#services/bot';
import { User } from '#models/user';


export const validateTelegramData = (rawData: string, token: string): [boolean, WebAppInitData] => {
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();

  const dataParams = new URLSearchParams(rawData);
  const hash = dataParams.get('hash');
  dataParams.delete('hash');

  const sortedKeys = Array.from(dataParams.keys()).sort();
  const dataCheckString = sortedKeys.map((key) => `${key}=${dataParams.get(key)}`).join('\n');
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const objectData = Object.fromEntries(Array.from(dataParams).map(([key, value]) => {
    try {
      return [key, JSON.parse(value)];
    } catch {
      return [key, value];
    }
  })) as WebAppInitData;

  return [hmac === hash, objectData];
}

export const updateUserPhoto = async (telegramUserId: number) => {
  const user = await User.findOne({ telegramId: telegramUserId }).exec();
  if (!user) {
    return;
  }

  const photos = await bot.api.getUserProfilePhotos(telegramUserId, { limit: 1 });
  if (!photos.photos.length) {
    return;
  }

  const photo = photos.photos[0][photos.photos[0].length - 1];

  const file: any = await bot.api.getFile(photo.file_id);
  const path = `/images/${file.file_unique_id}.jpg`;
  await file.download(env.get('STORAGE_PATH') + path);

  user.photoUrl = path;
  await user.save();
}
