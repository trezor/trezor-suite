import { useEffect, useMemo, useState } from 'react';

import { useDebounce } from '@trezor/react-utils';

import analyticsData from '../analytics.json';
import type { EventDoc } from '../types';

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

export const useFilteredEvents = () => {
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<'az' | 'za' | 'added' | 'updated'>('az');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [platform, setPlatform] = useState<'all' | string>('all');
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    const allEvents = useMemo(() => getEventsFromJson(analyticsData), []);
    const debounce = useDebounce();

    const getAdded = (e: EventDoc) => e.changelog?.addedInVersion;
    const getEffectiveUpdated = (e: EventDoc) =>
        e.changelog?.lastUpdatedInVersion ?? e.changelog?.addedInVersion;

    useEffect(() => {
        debounce(() => setDebouncedQuery(query));
    }, [query, debounce]);

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

    return {
        filteredEvents,
        setQuery,
        setSort,
        setPlatform,
        query,
        platform,
        sort,
        allEvents,
        debouncedQuery,
        normalizedQuery,
    };
};
