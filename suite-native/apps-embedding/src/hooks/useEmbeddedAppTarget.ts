import { useEffect, useEffectEvent } from 'react';
import { useSelector } from 'react-redux';

import { type AppsEmbeddingEvent } from '@suite-common/apps-embedding';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { exhaustive } from '@trezor/type-utils';

import { type EmbeddedAppTarget } from '../types';
import { resolveEmbeddedAppTarget } from '../utils/resolveEmbeddedAppTarget';

type UseEmbeddedAppTargetParams = {
    target: EmbeddedAppTarget;
    onEvent: (event: AppsEmbeddingEvent) => void;
};

// Why a target resolved to nothing, for the log.
const getUnresolvedTargetDetail = (target: EmbeddedAppTarget): string => {
    switch (target.kind) {
        case 'catalog-entry':
            return `catalog entry "${target.entryId}" is not in the catalog`;
        case 'custom-url':
            return `custom url ${target.url} is refused outside develop and debug builds`;
        default:
            return exhaustive(target);
    }
};

/**
 * What a host opens for `target`. As the desktop host, it resolves the page of a catalog entry
 * against the locale Suite runs in, and it reports a target with nothing to open — an entry the
 * catalog does not know, a custom url outside develop and debug builds — as a failed load, once;
 * such a target resolves to `null`.
 */
export const useEmbeddedAppTarget = ({ target, onEvent }: UseEmbeddedAppTargetParams) => {
    const locale = useSelector(selectSupportedLanguageLocale);
    const resolvedTarget = resolveEmbeddedAppTarget({ target, locale });
    const reportEvent = useEffectEvent(onEvent);

    // A string, so that the report is made once per target rather than once per render.
    const unresolvedTargetDetail =
        resolvedTarget === null ? getUnresolvedTargetDetail(target) : undefined;

    useEffect(() => {
        if (unresolvedTargetDetail !== undefined) {
            reportEvent({ type: 'load-failed', detail: unresolvedTargetDetail });
        }
    }, [unresolvedTargetDetail]);

    return resolvedTarget;
};
