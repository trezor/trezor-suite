import { useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from '@trezor/react-utils';

import { type SearchField, type Sort, searchFields } from '../types';
import {
    compareVersionsDesc,
    eventHasVersion,
    eventMatchesSearch,
    getAllVersions,
    getEventAddedVersion,
    getEventUpdatedVersion,
    getEventsFromJson,
    normalizeSearchFields,
} from './filterUtils';
import { getParamsFromUrl, updateUrl } from './urlParams';

const ANALYTICS_JSON_URL = `${import.meta.env.BASE_URL}analytics.json`;

const SEARCH_FIELDS_STORAGE_KEY = 'analytics-docs:search-in';
const DEFAULT_SEARCH_FIELDS: SearchField[] = [...searchFields];

const isSearchField = (value: unknown): value is SearchField =>
    searchFields.some(field => field === value);

const getInitialSearchFields = (): SearchField[] => {
    if (typeof window === 'undefined') return DEFAULT_SEARCH_FIELDS;

    try {
        const stored = window.localStorage.getItem(SEARCH_FIELDS_STORAGE_KEY);
        if (stored === null) return DEFAULT_SEARCH_FIELDS;

        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) return DEFAULT_SEARCH_FIELDS;

        const selected = normalizeSearchFields(parsed.filter(isSearchField));

        return selected.length > 0 ? selected : DEFAULT_SEARCH_FIELDS;
    } catch {
        return DEFAULT_SEARCH_FIELDS;
    }
};

export const useFilteredEvents = () => {
    const initial = useMemo(getParamsFromUrl, []);
    const [query, setQuery] = useState(initial.query);
    const [sort, setSort] = useState<Sort>(initial.sort);
    const [debouncedQuery, setDebouncedQuery] = useState(initial.query);
    const [platform, setPlatform] = useState<string>(initial.platform);
    const [version, setVersion] = useState<string>(initial.version);
    const [searchFieldsState, setSearchFieldsState] =
        useState<SearchField[]>(getInitialSearchFields);
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

    const setSearchFields = (next: readonly SearchField[]) => {
        const normalized = normalizeSearchFields(next);
        if (normalized.length === 0) return;

        setSearchFieldsState(current => {
            const isSame =
                current.length === normalized.length &&
                current.every((field, index) => field === normalized[index]);

            return isSame ? current : normalized;
        });
    };

    useEffect(() => {
        try {
            window.localStorage.setItem(
                SEARCH_FIELDS_STORAGE_KEY,
                JSON.stringify(searchFieldsState),
            );
        } catch {
            return;
        }
    }, [searchFieldsState]);

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
    }, [debouncedQuery, platform, sort, version, searchFieldsState]);

    const isFiltering = isPlatformSortFiltering;

    const filteredEvents = useMemo(() => {
        const byPlatformAndQuery = allEvents
            .filter(e => (platform === 'all' ? true : e.platform.includes(platform)))
            .filter(e => (version === 'all' ? true : eventHasVersion(e, version)))
            .filter(e => eventMatchesSearch(normalizedQuery, e, searchFieldsState));

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
    }, [allEvents, platform, version, normalizedQuery, sort, searchFieldsState]);

    const clearAll = () => {
        setQuery('');
        setPlatform('all');
        setSort('az');
        setVersion('all');
        setSearchFields(DEFAULT_SEARCH_FIELDS);
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
        setSearchFields,
        clearAll,
        query,
        platform,
        sort,
        version,
        searchFields: searchFieldsState,
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
