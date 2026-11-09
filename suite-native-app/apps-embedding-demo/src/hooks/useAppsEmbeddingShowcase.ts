import { useRef, useState } from 'react';

import {
    type AppsEmbeddingCatalogEntry,
    type AppsEmbeddingEvent,
    getAppsEmbeddingCatalogEntry,
} from '@suite-common/apps-embedding';
import { type EmbeddedAppTarget } from '@suite-native/apps-embedding';
import { type HttpsUrl } from '@trezor/type-utils';

// Enough to follow a session; a page posting messages in a loop cannot grow the log forever.
const MAX_LOG_ENTRIES = 200;

export type EmbeddingLogEntry = {
    id: number;
    time: string;
    event: AppsEmbeddingEvent;
};

export type EmbeddingMode = 'webView' | 'webBrowser';

type UseAppsEmbeddingShowcaseResult = {
    embedMode: EmbeddingMode;
    setEmbedMode: (mode: EmbeddingMode) => void;
    /** What is open, or `null` while the catalog shows. The hosts resolve it themselves. */
    target: EmbeddedAppTarget | null;
    selectedEntry: AppsEmbeddingCatalogEntry | undefined;
    logEntries: EmbeddingLogEntry[];
    addEvent: (event: AppsEmbeddingEvent) => void;
    clearEvents: () => void;
    openCatalogEntry: (entryId: string) => void;
    openCustomUrl: (url: HttpsUrl) => void;
    close: () => void;
};

export const useAppsEmbeddingShowcase = (): UseAppsEmbeddingShowcaseResult => {
    const [embedMode, setEmbedMode] = useState<EmbeddingMode>('webView');
    const [target, setTarget] = useState<EmbeddedAppTarget | null>(null);
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
        setTarget({ kind: 'catalog-entry', entryId });
    };

    const openCustomUrl = (url: HttpsUrl) => {
        setLogEntries([]);
        setTarget({ kind: 'custom-url', url });
    };

    const close = () => setTarget(null);

    const selectedEntry =
        target?.kind === 'catalog-entry' ? getAppsEmbeddingCatalogEntry(target.entryId) : undefined;

    return {
        embedMode,
        setEmbedMode,
        target,
        selectedEntry,
        logEntries,
        addEvent,
        clearEvents,
        openCatalogEntry,
        openCustomUrl,
        close,
    };
};
