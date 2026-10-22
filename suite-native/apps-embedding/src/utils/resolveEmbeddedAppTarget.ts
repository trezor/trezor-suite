import {
    getAppsEmbeddingCatalogEntry,
    getAppsEmbeddingCatalogEntryUrl,
    getPlatformSpecificEntry,
} from '@suite-common/apps-embedding';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { type HttpsUrl } from '@trezor/type-utils';
import { isNotUndefined, safeParseUrl } from '@trezor/utils';

import { type EmbeddedAppTarget } from '../types';

export type ResolvedEmbeddedAppTarget = {
    url: HttpsUrl;
    /**
     * Origins the main frame may navigate to: the origin of `url` and, for a catalog entry, its
     * `originWhitelist`. Empty when `url` has no origin to parse, so that the guard then blocks
     * everything rather than nothing.
     */
    allowedOrigins: string[];
    persistSession: boolean;
};

type ResolveEmbeddedAppTargetParams = {
    target: EmbeddedAppTarget;
    /** The locale Suite runs in, as Suite stores it, for an entry whose page depends on it. */
    locale: string;
};

type GetAllowedOriginsParams = {
    url: HttpsUrl;
    originWhitelist?: HttpsUrl[];
};

const getAllowedOrigins = ({ url, originWhitelist = [] }: GetAllowedOriginsParams) => {
    const origin = safeParseUrl(url)?.origin;

    if (origin === undefined) {
        return [];
    }

    // Only the origin of each item is matched, as the catalog promises: an item with a path
    // matches by its origin rather than never, and an item that is no url at all matches nothing.
    const whitelistedOrigins = originWhitelist
        .map(item => safeParseUrl(item)?.origin)
        .filter(isNotUndefined);

    return [origin, ...whitelistedOrigins];
};

/**
 * What a mobile host opens for `target`: read from the catalog for an entry, the mobile side of
 * what the desktop host does in its main process, or `null` for a target with nothing to open —
 * an entry id the catalog does not know, or a custom url outside develop and debug builds, where
 * the catalog alone says what Suite embeds.
 */
export const resolveEmbeddedAppTarget = ({
    target,
    locale,
}: ResolveEmbeddedAppTargetParams): ResolvedEmbeddedAppTarget | null => {
    if (target.kind === 'custom-url') {
        if (!isDevelopOrDebugEnv()) {
            return null;
        }

        return {
            url: target.url,
            allowedOrigins: getAllowedOrigins({ url: target.url }),
            persistSession: false,
        };
    }

    const entry = getAppsEmbeddingCatalogEntry(target.entryId);

    if (entry === undefined) {
        return null;
    }

    const url = getAppsEmbeddingCatalogEntryUrl(entry, { locale });
    const mobileEntry = getPlatformSpecificEntry(entry, 'mobile');

    return {
        url,
        allowedOrigins: getAllowedOrigins({ url, originWhitelist: mobileEntry?.originWhitelist }),
        persistSession: mobileEntry?.persistSession ?? false,
    };
};
