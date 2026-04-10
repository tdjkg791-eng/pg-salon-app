import { Client } from '@line/bot-sdk';

let cached: Client | null = null;

export function getLineClient(): Client {
  if (cached) return cached;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    throw new Error('Missing env LINE_CHANNEL_ACCESS_TOKEN');
  }
  cached = new Client({ channelAccessToken });
  return cached;
}

export async function pushTextMessage(userId: string, text: string): Promise<void> {
  const client = getLineClient();
  await client.pushMessage(userId, { type: 'text', text });
}

export async function replyTextMessage(replyToken: string, text: string): Promise<void> {
  const client = getLineClient();
  await client.replyMessage(replyToken, { type: 'text', text });
}
