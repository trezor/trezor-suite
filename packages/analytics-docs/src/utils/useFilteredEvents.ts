import { useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from '@trezor/react-utils';

import analyticsData from '../analytics.json';
import type { EventDoc } from '../types';

const VALID_PLATFORMS = ['all', 'desktop', 'mobile', 'shared'] as const;
const VALID_SORTS = ['az', 'za', 'added', 'updated'] as const;

function getParamsFromUrl(): {
    query: string;
    platform: (typeof VALID_PLATFORMS)[number];
    sort: (typeof VALID_SORTS)[number];
} {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const platformParam = params.get('platform') as (typeof VALID_PLATFORMS)[number];
    const sortParam = params.get('sort') as (typeof VALID_SORTS)[number];

    return {
        query: params.get('q') ?? '',
        platform: VALID_PLATFORMS.includes(platformParam) ? platformParam : 'all',
        sort: VALID_SORTS.includes(sortParam) ? sortParam : 'az',
    };
}

function updateUrl(query: string, platform: string, sort: string) {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (platform !== 'all') params.set('platform', platform);
    if (sort !== 'az') params.set('sort', sort);
    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;

    window.history.replaceState(null, '', url);
}

type AnalyticsJsonShape = {
    events?: Record<string, EventDoc>;
};

function getEventsFromJson(input: unknown): EventDoc[] {
    const data = input as AnalyticsJsonShape;

    if (!data || typeof data !== 'object') return [];
    if (!data.events || typeof data.events !== 'object') return [];

    return Object.values(data.events);
}

function parseVer(v?: string) {
    const [a = 0, b = 0, c = 0] = (v ?? '').split('.').map(n => Number(n) || 0);

    return [a, b, c] as const;
}

function isSubsequence(word: string, segment: string): boolean {
    let qi = 0;
    for (let hi = 0; hi < segment.length && qi < word.length; hi++) {
        if (segment[hi] === word[qi]) qi++;
    }

    return qi === word.length;
}

function fuzzyMatch(query: string, haystack: string): boolean {
    const tokens = query
        .toLowerCase()
        .trim()
        .split(/[\s_\-/]+/)
        .filter(Boolean);

    if (tokens.length === 0) return true;

    const segments = haystack.toLowerCase().split(/[/_]/);

    for (const token of tokens) {
        const found = segments.some(seg => isSubsequence(token, seg));
        if (!found) return false;
    }

    return true;
}

function cmpVerDesc(va?: string, vb?: string) {
    const [a1, b1, c1] = parseVer(va);
    const [a2, b2, c2] = parseVer(vb);

    if (a1 !== a2) return a2 - a1;
    if (b1 !== b2) return b2 - b1;
    if (c1 !== c2) return c2 - c1;

    return 0;
}

export type Sort = 'az' | 'za' | 'added' | 'updated';

export const useFilteredEvents = () => {
    const initial = useMemo(getParamsFromUrl, []);
    const [query, setQuery] = useState(initial.query);
    const [sort, setSort] = useState<Sort>(initial.sort);
    const [debouncedQuery, setDebouncedQuery] = useState(initial.query);
    const [platform, setPlatform] = useState<'all' | string>(initial.platform);
    const [isPlatformSortFiltering, setIsPlatformSortFiltering] = useState(false);
    const isInitialMount = useRef(true);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    const allEvents = useMemo(() => getEventsFromJson(analyticsData), []);
    const debounce = useDebounce();

    const getAdded = (e: EventDoc) => e.changelog?.addedInVersion;
    const getEffectiveUpdated = (e: EventDoc) =>
        e.changelog?.lastUpdatedInVersion ?? e.changelog?.addedInVersion;

    useEffect(() => {
        debounce(() => setDebouncedQuery(query));
    }, [query, debounce]);

    useEffect(() => {
        updateUrl(debouncedQuery, platform, sort);
    }, [debouncedQuery, platform, sort]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;

            return;
        }

        setIsPlatformSortFiltering(true);
        const id = setTimeout(() => setIsPlatformSortFiltering(false), 300);

        return () => clearTimeout(id);
    }, [debouncedQuery, platform, sort]);

    const isFiltering = isPlatformSortFiltering;

    const filteredEvents = useMemo(() => {
        const byPlatformAndQuery = allEvents
            .filter(e => {
                if (platform === 'all') return true;

                return e.platform.includes(platform);
            })
            .filter(e => {
                if (!normalizedQuery) return true;

                return fuzzyMatch(normalizedQuery, e.name);
            });

        return byPlatformAndQuery.sort((a, b) => {
            const an = a.name ?? '';
            const bn = b.name ?? '';

            if (sort === 'az') return an.localeCompare(bn);
            if (sort === 'za') return bn.localeCompare(an);

            if (sort === 'added') {
                const c = cmpVerDesc(getAdded(a), getAdded(b));

                return c !== 0 ? c : an.localeCompare(bn);
            }

            if (sort === 'updated') {
                const c = cmpVerDesc(getEffectiveUpdated(a), getEffectiveUpdated(b));

                return c !== 0 ? c : an.localeCompare(bn);
            }

            return an.localeCompare(bn);
        });
    }, [allEvents, platform, normalizedQuery, sort]);

    const clearAll = () => {
        setQuery('');
        setPlatform('all');
        setSort('az');
        setIsPlatformSortFiltering(true);
        setTimeout(() => setIsPlatformSortFiltering(false), 300);
    };

    return {
        filteredEvents,
        setQuery,
        setSort,
        setPlatform,
        clearAll,
        query,
        platform,
        sort,
        allEvents,
        debouncedQuery,
        normalizedQuery,
        isFiltering,
    };
};
