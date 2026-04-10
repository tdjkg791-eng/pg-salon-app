import { NextRequest, NextResponse } from 'next/server';
import { validateSignature } from '@line/bot-sdk';
import { createServerClient } from '@/lib/supabase/server';
import { parseLineMessage } from '@/lib/line/webhook-parser';
import { getLineClient, replyTextMessage } from '@/lib/line/messaging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface LineSource {
  type: string;
  userId?: string;
}

interface LineMessage {
  id: string;
  type: string;
  text?: string;
}

interface LineEvent {
  type: string;
  timestamp: number;
  replyToken?: string;
  source: LineSource;
  message?: LineMessage;
}

async function handleTextMessage(
  supabase: ReturnType<typeof createServerClient>,
  clientId: string,
  event: LineEvent,
  message: LineMessage
): Promise<void> {
  const text = message.text ?? '';
  const intent = parseLineMessage(text, new Date(event.timestamp));
  const date = todayIso();

  if (intent.kind === 'weight') {
    const { data: existing } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle();

    let morning_kg: number | null = existing?.morning_kg ?? null;
    let evening_kg: number | null = existing?.evening_kg ?? null;

    if (intent.slot === 'morning') {
      morning_kg = intent.weightKg;
    } else if (intent.slot === 'evening') {
      evening_kg = intent.weightKg;
    } else if (morning_kg == null) {
      morning_kg = intent.weightKg;
    } else {
      evening_kg = intent.weightKg;
    }

    if (existing) {
      await supabase
        .from('weight_logs')
        .update({ morning_kg, evening_kg, source: 'line' })
        .eq('id', existing.id);
    } else {
      await supabase.from('weight_logs').insert({
        client_id: clientId,
        date,
        morning_kg,
        evening_kg,
        source: 'line',
      });
    }

    if (event.replyToken) {
      await replyTextMessage(
        event.replyToken,
        `体重${intent.weightKg}kgを記録しました。`
      );
    }
    return;
  }

  if (intent.kind === 'menstrual_start') {
    const { data: existing } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('weight_logs')
        .update({ is_menstrual: true })
        .eq('id', existing.id);
    } else {
      await supabase.from('weight_logs').insert({
        client_id: clientId,
        date,
        is_menstrual: true,
        source: 'line',
      });
    }

    if (event.replyToken) {
      await replyTextMessage(
        event.replyToken,
        '体重が減りにくい時期です。正常な反応ですので安心してください。食事管理を継続することが大切です。'
      );
    }
    return;
  }

  if (intent.kind === 'day_complete') {
    const { data: existing } = await supabase
      .from('meal_reports')
      .select('id')
      .eq('client_id', clientId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('meal_reports')
        .update({ day_complete: true })
        .eq('id', existing.id);
    } else {
      await supabase.from('meal_reports').insert({
        client_id: clientId,
        date,
        day_complete: true,
      });
    }

    if (event.replyToken) {
      await replyTextMessage(
        event.replyToken,
        '今日の記録ありがとうございます。スタッフが確認します。'
      );
    }
    return;
  }

  // kind === 'text' — upsert meal_reports no-op
  const { data: existing } = await supabase
    .from('meal_reports')
    .select('id')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();

  if (!existing) {
    await supabase.from('meal_reports').insert({
      client_id: clientId,
      date,
    });
  }

  if (event.replyToken) {
    await replyTextMessage(event.replyToken, 'メッセージを受け取りました。');
  }
}

async function handleImageMessage(
  supabase: ReturnType<typeof createServerClient>,
  clientId: string,
  event: LineEvent,
  message: LineMessage
): Promise<void> {
  const date = todayIso();
  const client = getLineClient();

  const stream = await client.getMessageContent(message.id);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const path = `${clientId}/${date}/${message.id}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('meal-photos')
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    console.error('[line/webhook] storage upload failed', uploadError);
    return;
  }

  // Ensure meal_reports row exists for today
  const { data: report } = await supabase
    .from('meal_reports')
    .select('id')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();

  let reportId: string | null = report?.id ?? null;
  if (!reportId) {
    const { data: inserted } = await supabase
      .from('meal_reports')
      .insert({ client_id: clientId, date })
      .select('id')
      .single();
    reportId = inserted?.id ?? null;
  }

  await supabase.from('meal_photos').insert({
    client_id: clientId,
    report_id: reportId,
    date,
    storage_path: path,
    line_message_id: message.id,
  });

  if (event.replyToken) {
    await replyTextMessage(event.replyToken, '写真を受け取りました');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    throw new Error('Missing env LINE_CHANNEL_SECRET');
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-line-signature') ?? '';

  if (!validateSignature(rawBody, channelSecret, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as { events?: LineEvent[] };
    const events = body.events ?? [];
    const supabase = createServerClient();

    for (const event of events) {
      try {
        if (event.type !== 'message' || !event.message) continue;
        const lineUserId = event.source?.userId;
        if (!lineUserId) continue;

        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('line_user_id', lineUserId)
          .maybeSingle();

        if (!client) {
          if (event.replyToken) {
            try {
              await replyTextMessage(
                event.replyToken,
                'ご登録がまだのようです。サロンから案内されたリンクからご登録をお願いします。'
              );
            } catch (err) {
              console.error('[line/webhook] onboarding reply failed', err);
            }
          }
          continue;
        }

        if (event.message.type === 'text') {
          await handleTextMessage(supabase, client.id, event, event.message);
        } else if (event.message.type === 'image') {
          await handleImageMessage(supabase, client.id, event, event.message);
        }
      } catch (eventErr) {
        console.error('[line/webhook] event error', eventErr);
      }
    }
  } catch (err) {
    console.error('[line/webhook] handler error', err);
  }

  return NextResponse.json({ ok: true });
}
