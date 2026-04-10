import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface LineTokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const origin = req.nextUrl.origin;

  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=login_failed', origin));
    }

    const channelId = process.env.LINE_CHANNEL_ID;
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelId) throw new Error('Missing env LINE_CHANNEL_ID');
    if (!channelSecret) throw new Error('Missing env LINE_CHANNEL_SECRET');

    const redirectUri =
      process.env.LINE_LOGIN_REDIRECT_URI ?? `${origin}/api/line/callback`;

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[line/callback] token exchange failed', errText);
      return NextResponse.redirect(new URL('/?error=login_failed', origin));
    }

    const token = (await tokenRes.json()) as LineTokenResponse;

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      console.error('[line/callback] profile fetch failed', errText);
      return NextResponse.redirect(new URL('/?error=login_failed', origin));
    }

    const profile = (await profileRes.json()) as LineProfile;

    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from('clients')
      .select('id, name')
      .eq('line_user_id', profile.userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('clients').insert({
        line_user_id: profile.userId,
        name: profile.displayName,
      });
    }

    void state;

    const res = NextResponse.redirect(new URL('/home', origin));
    res.cookies.set('line_user_id', profile.userId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error('[line/callback] error', err);
    return NextResponse.redirect(new URL('/?error=login_failed', origin));
  }
}
