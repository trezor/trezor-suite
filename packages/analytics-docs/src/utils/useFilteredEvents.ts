import { useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from '@trezor/react-utils';

import type { SearchMode, Sort } from '../types';
import {
    compareVersionsDesc,
    eventHasVersion,
    eventMatchesFullText,
    eventNameMatchesQuery,
    getAllVersions,
    getEventAddedVersion,
    getEventUpdatedVersion,
    getEventsFromJson,
} from './filterUtils';
import { getParamsFromUrl, updateUrl } from './urlParams';

const ANALYTICS_JSON_URL = `${import.meta.env.BASE_URL}analytics.json`;

const SEARCH_MODE_STORAGE_KEY = 'analytics-docs:search-mode';

const getInitialSearchMode = (): SearchMode => {
    if (typeof window === 'undefined') return 'fulltext';
    const stored = window.localStorage.getItem(SEARCH_MODE_STORAGE_KEY);

    return stored === 'name' || stored === 'fulltext' ? stored : 'fulltext';
};

export const useFilteredEvents = () => {
    const initial = useMemo(getParamsFromUrl, []);
    const [query, setQuery] = useState(initial.query);
    const [sort, setSort] = useState<Sort>(initial.sort);
    const [debouncedQuery, setDebouncedQuery] = useState(initial.query);
    const [platform, setPlatform] = useState<string>(initial.platform);
    const [version, setVersion] = useState<string>(initial.version);
    const [searchMode, setSearchMode] = useState<SearchMode>(getInitialSearchMode);
    const [isSidebarOpen, setIsSidebarOpen] = useState(initial.sidebarOpen);
    const [isLiveLogOpen, setIsLiveLogOpen] = useState(initial.liveLogOpen);
    const [isSidebarLoading, setIsSidebarLoading] = useState(false);
    const [isPlatformSortFiltering, setIsPlatformSortFiltering] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<unknown | null>(null);
    const isInitialMount = useRef(true);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    useEffect(() => {
        fetch(ANALYTICS_JSON_URL)
            .then(res => (res.ok ? res.json() : null))
            .then(data => setAnalyticsData(data ?? {}))
            .catch(() => setAnalyticsData({}));
    }, []);

    const allEvents = useMemo(() => getEventsFromJson(analyticsData ?? {}), [analyticsData]);
    const availableVersions = useMemo(() => getAllVersions(allEvents), [allEvents]);
    const isAnalyticsDataGenerated =
        analyticsData !== null &&
        typeof analyticsData === 'object' &&
        'events' in analyticsData &&
        typeof (analyticsData as { events?: unknown }).events === 'object';
    const debounce = useDebounce();

    useEffect(() => {
        debounce(() => setDebouncedQuery(query));
    }, [query, debounce]);

    useEffect(() => {
        updateUrl(debouncedQuery, platform, sort, version, isSidebarOpen, isLiveLogOpen);
    }, [debouncedQuery, platform, sort, version, isSidebarOpen, isLiveLogOpen]);

    useEffect(() => {
        try {
            window.localStorage.setItem(SEARCH_MODE_STORAGE_KEY, searchMode);
        } catch {
            return;
        }
    }, [searchMode]);

    useEffect(() => {
        const id = setTimeout(() => setIsSidebarLoading(false), 200);

        return () => clearTimeout(id);
    }, [isSidebarOpen]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;

            return;
        }

        setIsPlatformSortFiltering(true);
        const id = setTimeout(() => setIsPlatformSortFiltering(false), 300);

        return () => clearTimeout(id);
    }, [debouncedQuery, platform, sort, version]);

    const isFiltering = isPlatformSortFiltering;

    const filteredEvents = useMemo(() => {
        const byPlatformAndQuery = allEvents
            .filter(e => (platform === 'all' ? true : e.platform.includes(platform)))
            .filter(e => (version === 'all' ? true : eventHasVersion(e, version)))
            .filter(e =>
                searchMode === 'fulltext'
                    ? eventMatchesFullText(normalizedQuery, e)
                    : eventNameMatchesQuery(normalizedQuery, e),
            );

        return byPlatformAndQuery.sort((a, b) => {
            const an = a.name ?? '';
            const bn = b.name ?? '';

            if (sort === 'az') return an.localeCompare(bn);
            if (sort === 'za') return bn.localeCompare(an);

            if (sort === 'added') {
                const c = compareVersionsDesc(getEventAddedVersion(a), getEventAddedVersion(b));

                return c !== 0 ? c : an.localeCompare(bn);
            }

            if (sort === 'updated') {
                const c = compareVersionsDesc(getEventUpdatedVersion(a), getEventUpdatedVersion(b));

                return c !== 0 ? c : an.localeCompare(bn);
            }

            return an.localeCompare(bn);
        });
    }, [allEvents, platform, version, normalizedQuery, sort, searchMode]);

    const clearAll = () => {
        setQuery('');
        setPlatform('all');
        setSort('az');
        setVersion('all');
        setIsPlatformSortFiltering(true);
        setTimeout(() => setIsPlatformSortFiltering(false), 300);
    };

    const generatedAt =
        analyticsData !== null &&
        typeof analyticsData === 'object' &&
        'generatedAt' in analyticsData &&
        typeof (analyticsData as { generatedAt?: unknown }).generatedAt === 'string'
            ? (analyticsData as { generatedAt: string }).generatedAt
            : undefined;

    return {
        filteredEvents,
        setQuery,
        setSort,
        setPlatform,
        setVersion,
        setSearchMode,
        clearAll,
        query,
        platform,
        sort,
        version,
        searchMode,
        availableVersions,
        allEvents,
        debouncedQuery,
        normalizedQuery,
        isFiltering,
        isSidebarOpen,
        isLiveLogOpen,
        isSidebarLoading,
        isAnalyticsDataGenerated,
        isAnalyticsDataLoading: analyticsData === null,
        generatedAt,
        setIsSidebarOpen,
        setIsLiveLogOpen,
        setIsSidebarLoading,
    };
};
