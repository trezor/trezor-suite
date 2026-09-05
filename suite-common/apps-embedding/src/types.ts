import { z } from 'zod';

import { type HttpsUrl } from '@trezor/type-utils';

export type AppsEmbeddingCommCapability = 'callbackUrls' | 'postMessage';

export const AppsEmbeddingCallbackStatusSchema = z.enum(['success', 'failure']);
export type AppsEmbeddingCallbackStatus = z.infer<typeof AppsEmbeddingCallbackStatusSchema>;

export type AppsEmbeddingCatalogEntry = {
    id: string;
    name: string;
    description: string;
    url: HttpsUrl;

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
    | { type: 'window-open-attempt'; url: string }
    // Hosts without an inline viewport (the system browser) can only observe
    // the session being closed.
    | { type: 'closed'; detail: string };
