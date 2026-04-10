// LIFF client-side helpers

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl: string | undefined;
}

export async function initLiff(liffId: string): Promise<void> {
  const mod = await import('@line/liff');
  const liff = mod.default;
  await liff.init({ liffId });
  if (!liff.isLoggedIn()) {
    liff.login();
  }
}

export async function getLineProfile(): Promise<LineProfile> {
  const mod = await import('@line/liff');
  const liff = mod.default;
  if (!liff.isLoggedIn()) {
    liff.login();
    // login triggers a redirect; return a stub to satisfy types
    return { userId: '', displayName: '', pictureUrl: undefined };
  }
  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  };
}
