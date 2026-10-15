import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AppsEmbeddingCatalogEntry,
    type AppsEmbeddingEvent,
    getAppsEmbeddingCatalogEntry,
    getAppsEmbeddingCatalogEntryUrl,
} from '@suite-common/apps-embedding';
import { selectSupportedLanguageLocale } from '@suite-native/intl';
import { type HttpsUrl } from '@trezor/type-utils';

// Enough to follow a session; a page posting messages in a loop cannot grow the log forever.
const MAX_LOG_ENTRIES = 200;

export type EmbeddingLogEntry = {
    id: number;
    time: string;
    event: AppsEmbeddingEvent;
};

export type EmbeddingMode = 'webView' | 'webBrowser';

type EmbeddingTarget = { kind: 'catalog'; entryId: string } | { kind: 'custom'; url: HttpsUrl };

type UseAppsEmbeddingShowcaseResult = {
    embedMode: EmbeddingMode;
    setEmbedMode: (mode: EmbeddingMode) => void;
    selectedEntry: AppsEmbeddingCatalogEntry | undefined;
    targetUrl: HttpsUrl | undefined;
    logEntries: EmbeddingLogEntry[];
    addEvent: (event: AppsEmbeddingEvent) => void;
    clearEvents: () => void;
    openCatalogEntry: (entryId: string) => void;
    openCustomUrl: (url: HttpsUrl) => void;
    close: () => void;
};

export const useAppsEmbeddingShowcase = (): UseAppsEmbeddingShowcaseResult => {
    const locale = useSelector(selectSupportedLanguageLocale);
    const [embedMode, setEmbedMode] = useState<EmbeddingMode>('webView');
    const [target, setTarget] = useState<EmbeddingTarget | null>(null);
    const [logEntries, setLogEntries] = useState<EmbeddingLogEntry[]>([]);
    const nextLogEntryIdRef = useRef(0);

    const addEvent = (event: AppsEmbeddingEvent) => {
        const id = nextLogEntryIdRef.current;
        nextLogEntryIdRef.current += 1;

        setLogEntries(currentEntries =>
            [...currentEntries, { id, time: new Date().toLocaleTimeString(), event }].slice(
                -MAX_LOG_ENTRIES,
            ),
        );
    };

    const clearEvents = () => setLogEntries([]);

    const openCatalogEntry = (entryId: string) => {
        setLogEntries([]);
        setTarget({ kind: 'catalog', entryId });
    };

    const openCustomUrl = (url: HttpsUrl) => {
        setLogEntries([]);
        setTarget({ kind: 'custom', url });
    };

    const close = () => setTarget(null);

    const selectedEntry =
        target?.kind === 'catalog' ? getAppsEmbeddingCatalogEntry(target.entryId) : undefined;

    const catalogEntryUrl =
        selectedEntry === undefined
            ? undefined
            : getAppsEmbeddingCatalogEntryUrl(selectedEntry, { locale });

    const targetUrl = target?.kind === 'custom' ? target.url : catalogEntryUrl;

    return {
        embedMode,
        setEmbedMode,
        selectedEntry,
        targetUrl,
        logEntries,
        addEvent,
        clearEvents,
        openCatalogEntry,
        openCustomUrl,
        close,
    };
};
