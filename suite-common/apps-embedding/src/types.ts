import { z } from 'zod';

import { type HttpsUrl } from '@trezor/type-utils';

export type AppsEmbeddingCommCapability = 'callbackUrls' | 'postMessage';

/** What the host did with a `window.open` the embedded page attempted. */
export type AppsEmbeddingWindowOpenOutcome = 'denied' | 'opened-in-app';

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
               * workers between Suite restarts. Off by default: an entry that has no reason to be
               * remembered is cheaper to reason about, and the showcase is mostly about first-load
               * behavior.
               *
               * Only the desktop host can honour it: it gives such an entry a session of its own on
               * disk, one directory per entry, so entries cannot read each other's cookies. The
               * other platforms have no such flag because persistence is not Suite's to control
               * there: web embeds in an iframe inside Suite's own origin storage, which persists
               * regardless, and on mobile the inline WebView is always incognito while the
               * system-browser mode hands the site the real browser session.
               *
               * What persistence buys the site is worth knowing before setting this:
               * - Nothing here is encrypted by Suite. Chromium encrypts cookie *values* through the
               *   OS keychain; localStorage, IndexedDB and the cache are plain files, so the real
               *   protection at rest is the user's disk encryption.
               * - A popup the entry is allowed to open shares the session, so a third-party sheet
               *   remembers the user across restarts too — Electron gives no way to split that.
               * - Service workers survive the view being closed, so the site keeps a foothold that
               *   can run on the next load.
               */
              persistSession?: boolean;

              /**
               * Origins the embedded site may navigate to besides the origin of `url` — the
               * allowlist of the host's `will-navigate` guard. Real flows leave their own
               * origin: a redirect-based payment step, an OAuth screen, a 3-D Secure hop. Every
               * off-origin navigation that is not declared here is blocked and reported, so a
               * site with no business leaving its origin still cannot. The web iframe and the
               * mobile hosts have no equivalent guard, which is why the list lives here.
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
    // One event with an outcome rather than an event per destination: the interesting part of the
    // log line is that the page reached for a window at all, and where it ended up is what the two
    // popup modes are being compared on.
    | { type: 'window-open-attempt'; url: string; outcome: AppsEmbeddingWindowOpenOutcome }
    | { type: 'navigation-blocked'; url: string }
    // Hosts without an inline viewport (the system browser) can only observe
    // the session being closed.
    | { type: 'closed'; detail: string };
