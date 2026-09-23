import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectLanguage } from '@suite/settings';
import {
    type AppsEmbeddingCatalogEntry,
    type AppsEmbeddingEvent,
    getAppsEmbeddingCatalogEntry,
    getAppsEmbeddingCatalogEntryUrl,
} from '@suite-common/apps-embedding';

export type EmbeddingLogEntry = {
    id: number;
    time: string;
    event: AppsEmbeddingEvent;
};

type EmbeddingTarget = { kind: 'catalog'; entryId: string } | { kind: 'custom'; url: string };

export type UseAppsEmbeddingShowcaseResult = {
    selectedEntry: AppsEmbeddingCatalogEntry | undefined;
    targetUrl: string | undefined;
    logEntries: EmbeddingLogEntry[];
    addEvent: (event: AppsEmbeddingEvent) => void;
    clearEvents: () => void;
    openCatalogEntry: (entryId: string) => void;
    openCustomUrl: (url: string) => void;
    close: () => void;
};

export const useAppsEmbeddingShowcase = (): UseAppsEmbeddingShowcaseResult => {
    const language = useSelector(selectLanguage);
    const [target, setTarget] = useState<EmbeddingTarget | null>(null);
    const [logEntries, setLogEntries] = useState<EmbeddingLogEntry[]>([]);
    const nextLogEntryIdRef = useRef(0);

    const addEvent = useCallback((event: AppsEmbeddingEvent) => {
        const id = nextLogEntryIdRef.current;
        nextLogEntryIdRef.current += 1;

        setLogEntries(currentEntries => [
            ...currentEntries,
            { id, time: new Date().toLocaleTimeString(), event },
        ]);
    }, []);

    const clearEvents = useCallback(() => setLogEntries([]), []);

    const openCatalogEntry = useCallback((entryId: string) => {
        setLogEntries([]);
        setTarget({ kind: 'catalog', entryId });
    }, []);

    const openCustomUrl = useCallback((url: string) => {
        setLogEntries([]);

        setTarget({ kind: 'custom', url });
    }, []);

    const close = useCallback(() => setTarget(null), []);

    const selectedEntry =
        target?.kind === 'catalog' ? getAppsEmbeddingCatalogEntry(target.entryId) : undefined;

    const catalogEntryUrl =
        selectedEntry === undefined
            ? undefined
            : getAppsEmbeddingCatalogEntryUrl(selectedEntry, { locale: language });

    const targetUrl = target?.kind === 'custom' ? target.url : catalogEntryUrl;

    return {
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
