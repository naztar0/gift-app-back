import * as crypto from 'node:crypto';
import env from '#start/env';

const aesKey = env.get('APP_TOKEN').split(':')[1].slice(0, 16);
const iv = Buffer.from(env.get('AES_IV'), 'hex');

export const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv('aes-128-cbc', aesKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64url');
  encrypted += cipher.final('base64url');
  return encrypted;
}

export const decrypt = (text: string) => {
  const decipher = crypto.createDecipheriv('aes-128-cbc', aesKey, iv);
  let decrypted = decipher.update(text, 'base64url', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
