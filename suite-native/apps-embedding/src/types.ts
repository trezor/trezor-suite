import { type HttpsUrl } from '@trezor/type-utils';

/**
 * What a mobile host opens. A catalog entry is named, never described, as on desktop: the host
 * resolves its page and everything about it — where it may navigate, whether it keeps its data —
 * from the catalog. A custom url declares nothing: it opens in a non-persistent session and may
 * not leave its origin. Only for demo purposes, and refused by the hosts outside develop and debug
 * builds; production code passes a catalog entry.
 */
export type EmbeddedAppTarget =
    | {
          kind: 'catalog-entry';
          entryId: string;
      }
    | {
          kind: 'custom-url';
          url: HttpsUrl;
      };
