import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

type OAuthLoginConfig = {
  oauthPortalUrl?: string;
  appId?: string;
  origin: string;
  nonce: string;
};

export function buildOAuthLoginUrl({ oauthPortalUrl, appId, origin, nonce }: OAuthLoginConfig) {
  if (!oauthPortalUrl || !appId) {
    throw new Error("La connexion OAuth n’est pas configurée. Configurez VITE_OAUTH_PORTAL_URL et VITE_APP_ID dans Vercel, puis redéployez.");
  }
  const redirectUri = `${origin}/api/oauth/callback`;
  const state = encodeOAuthState({ redirectUri, nonce });
  const url = new URL("/app-auth", oauthPortalUrl);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
}

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export const startLogin = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const nonce = crypto.randomUUID();
  const loginUrl = buildOAuthLoginUrl({ oauthPortalUrl, appId, origin: window.location.origin, nonce });
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  window.location.href = loginUrl;
};
