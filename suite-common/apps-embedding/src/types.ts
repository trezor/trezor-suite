import { z } from 'zod';

import { type HttpsUrl } from '@trezor/type-utils';

export type AppsEmbeddingCommCapability = 'callbackUrls' | 'postMessage';

/** What the host did with a `window.open` the embedded page attempted. */
export type AppsEmbeddingWindowOpenOutcome = 'denied' | 'opened-in-app';

/**
 * Where an HTTP authentication challenge from the embedded site's server ended up:
 * - `requested`: the host is asking the user for credentials;
 * - `submitted` / `cancelled`: how the user answered;
 * - `dismissed`: the challenge died before an answer, e.g. the page navigated away;
 * - `refused`: the host turned it down without asking, by one of its own rules.
 */
export type AppsEmbeddingHttpAuthOutcome =
    'requested' | 'submitted' | 'cancelled' | 'dismissed' | 'refused';

export const AppsEmbeddingCallbackStatusSchema = z.enum(['success', 'failure']);
export type AppsEmbeddingCallbackStatus = z.infer<typeof AppsEmbeddingCallbackStatusSchema>;

export type AppsEmbeddingCatalogEntryUrlParams = {
    /** The locale Suite runs in, as Suite stores it, e.g. `cs-CZ`. */
    locale: string;
};

export const ENTRY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ENTRY_ID_MAX_LENGTH = 40;

/**
 * Catalog entry id. On desktop it decides which on-disk session the entry gets, so it ends up as a
 * directory name — hence lowercase-only (macOS and Windows would fold two casings into one
 * directory), no dots (`x.` and `x` are the same file on Windows) and a length cap (Chromium's own
 * storage tree underneath it is deep enough to reach Windows' path limit).
 *
 * This is the renderer-side guard only. The main process re-checks the id and resolves it against
 * the catalog before building any path: this schema runs in the preload, which is the renderer, and
 * the `ipcMain` wrapper validates the sender frame rather than the payload.
 */
export const appsEmbeddingEntryId = z.string().max(ENTRY_ID_MAX_LENGTH).regex(ENTRY_ID_PATTERN);

export type AppsEmbeddingCatalogEntry = {
    /**
     * Stable identifier, and on desktop also the directory name of the entry's own session when its
     * `desktop` [platformSpecific] entry sets `persistSession`. Keep it lowercase kebab-case and
     * short: it has to behave the same on a case-insensitive filesystem (macOS, Windows) as on a
     * case-sensitive one, and it sits inside a Chromium storage tree that is already deep enough to
     * reach Windows' path limit. The catalog unit test enforces the shape.
     */
    id: string;
    name: string;
    description: string;

    /**
     * The page to embed, or how to build it for a site with a page per language. Read it through
     * `getAppsEmbeddingCatalogEntryUrl`, which resolves both.
     */
    url: HttpsUrl | ((params: AppsEmbeddingCatalogEntryUrlParams) => HttpsUrl);

    /**
     * Communication capabilities supported by the embedded site.
     * - 'callbackUrls': The embedded site finishes flow by navigating for example to a success/failure callback URL, which points back to Suite and triggers a corresponding callback event.
     * - 'postMessage': The embedded site communicates with the host via the postMessage API, sending structured messages that the host can listen for, strictly validate and respond to.
     */
    communication: AppsEmbeddingCommCapability[];

    /**
     * TODO:
     * Once we're going to implement specific site/s that support commnunication via message channel,
     * define for that specific `origin` only subset allowed messages (inferred from Zod schemas) as discriminated union type.
     */
    // messages?: unknown[];

    platformSpecific?: (
        | {
              kind: 'web';
              allow?: string;
              sandbox?: string[];

              /**
               * Human-readable notes on what the showcase is expected to demonstrate per platform,
               * documenting where an API does NOT work is as valuable as where it does.
               */
              expectedBehavior: string;
          }
        | {
              kind: 'desktop';
              expectedBehavior: string;

              /**
               * Whether the site keeps its cookies, localStorage, IndexedDB, cache and service
               * workers between visits and Suite restarts. Off by default, in which case everything
               * the site stored is forgotten the moment it is closed: an entry that has no reason
               * to be remembered is cheaper to reason about, and the showcase is mostly about
               * first-load behavior.
               *
               * Only the desktop host gives such an entry a session of its own on disk, one
               * directory per entry, so entries cannot read each other's cookies. Web has no such
               * flag: an iframe lives in Suite's own origin storage, which persists regardless. The
               * `mobile` record has a `persistSession` of its own, backed by a store that every
               * persisting entry shares.
               */
              persistSession?: boolean;

              /**
               * Origins the embedded site may navigate to besides the origin of `url` — the
               * allowlist of the host's `will-navigate` and `will-redirect` guards. Real flows
               * leave their own origin: a redirect-based payment step, an OAuth screen, a 3-D
               * Secure hop. Every off-origin navigation that is not declared here — a server-side
               * redirect included — is blocked and reported, so a site with no business leaving
               * its origin still cannot. The web iframe and the mobile hosts have no equivalent
               * guard, which is why the list lives here.
               *
               * Bare origins (scheme + host + port). Only the origin of each item is matched, so
               * a path would be silently ignored.
               */
              redirectExternalOrigins?: HttpsUrl[];

              /**
               * Origins the embedded site may open in a window of its own — the allowlist of the
               * host's `setWindowOpenHandler`. A popup keeps the `window.opener` channel that a
               * redirect cannot, which is how a payment sheet hands its result back to the
               * merchant page.
               *
               * The list stands on its own rather than extending [redirectExternalOrigins]: with
               * nothing declared no popup opens at all, and even a same-origin popup has to be
               * listed. Same shape and matching as [redirectExternalOrigins].
               */
              popupExternalOrigins?: HttpsUrl[];
          }
        | {
              kind: 'mobile';
              expectedBehavior: string;

              /**
               * Whether the site keeps its cookies, web storage and cache between openings and
               * Suite restarts. Off by default, as on desktop: the inline WebView then opens the
               * site in a non-persistent store (`incognito`), and the iOS system browser in an
               * ephemeral `ASWebAuthenticationSession`, so nothing the site stored outlives the
               * session.
               *
               * Unlike desktop, mobile has no store per entry: every persisting entry shares the
               * app's default `WKWebsiteDataStore` on iOS and the app's single WebView profile on
               * Android, where an incognito opening of any entry also clears that profile's
               * cookies, cache, history and form data (its web storage survives). The Android
               * system browser (Chrome Custom Tabs) cannot honour the flag at all: it runs in
               * Chrome's own profile, which persists regardless.
               */
              persistSession?: boolean;

              /**
               * Origins the embedded site may navigate to besides the origin of `url` — the
               * allowlist of the WebView host's navigation guard, and the mobile counterpart of
               * [redirectExternalOrigins]. Every main-frame navigation off the list, a server-side
               * redirect included, is blocked and reported; subframes are not held to it, as on
               * desktop. The system browser has no guard.
               *
               * The guard is Suite's own `onShouldStartLoadWithRequest` handler, not the
               * `originWhitelist` prop of `react-native-webview` the option is named after: the
               * prop matches origin prefixes, applies to iframe loads as well on iOS, and opens
               * whatever it refuses in another app or the system browser through `Linking.openURL`
               * instead of blocking it.
               *
               * Same shape and matching as [redirectExternalOrigins]: bare origins, and only the
               * origin of each item is matched.
               */
              originWhitelist?: HttpsUrl[];
          }
    )[];
};

export type PlatformSpecificEntry = NonNullable<
    AppsEmbeddingCatalogEntry['platformSpecific']
>[number];

export type PlatformSpecificOfKind<K extends PlatformSpecificEntry['kind']> = Extract<
    PlatformSpecificEntry,
    { kind: K }
>;

export function getPlatformSpecificEntry<
    E extends AppsEmbeddingCatalogEntry,
    K extends PlatformSpecificEntry['kind'],
>(entry: E | undefined, kind: K) {
    return (
        entry?.platformSpecific?.find((e): e is PlatformSpecificOfKind<K> => e.kind === kind) ??
        null
    );
}

export type AppsEmbeddingEvent =
    | { type: 'loaded'; detail: string }
    | { type: 'navigated'; url: string }
    | { type: 'load-failed'; detail: string }
    | { type: 'callback'; status: AppsEmbeddingCallbackStatus; url: string }
    | { type: 'message'; data: unknown }
    // A message the host refused to take in — too large to be a structured message. `detail`
    // carries the host's reason.
    | { type: 'message-dropped'; detail: string }
    // One event with an outcome rather than an event per destination: the interesting part of the
    // log line is that the page reached for a window at all, and where it ended up is what the two
    // popup modes are being compared on.
    | { type: 'window-open-attempt'; url: string; outcome: AppsEmbeddingWindowOpenOutcome }
    | { type: 'navigation-blocked'; url: string }
    // The origin that asked, never the url or what was typed: the log is the one place the
    // credentials must not end up. `detail` carries the host's reason for a refusal.
    | { type: 'http-auth'; origin: string; outcome: AppsEmbeddingHttpAuthOutcome; detail?: string }
    // Hosts without an inline viewport (the system browser) can only observe
    // the session being closed.
    | { type: 'closed'; detail: string };
