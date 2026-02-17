import type { EventDoc } from '../types';

type AnalyticsJsonShape = {
    events?: Record<string, EventDoc>;
};

export const getEventsFromJson = (input: unknown): EventDoc[] => {
    const data = input as AnalyticsJsonShape;

    if (!data || typeof data !== 'object') return [];
    if (!data.events || typeof data.events !== 'object') return [];

    return Object.values(data.events);
};

const parseVer = (v?: string): readonly [number, number, number] => {
    const [a = 0, b = 0, c = 0] = (v ?? '').split('.').map(n => Number(n) || 0);

    return [a, b, c];
};

const isSubsequence = (word: string, segment: string): boolean => {
    let qi = 0;
    for (let hi = 0; hi < segment.length && qi < word.length; hi++) {
        if (segment[hi] === word[qi]) qi++;
    }

    return qi === word.length;
};

export const fuzzyMatch = (query: string, haystack: string): boolean => {
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
};

export const compareVersionsDesc = (va?: string, vb?: string): number => {
    const [a1, b1, c1] = parseVer(va);
    const [a2, b2, c2] = parseVer(vb);

    if (a1 !== a2) return a2 - a1;
    if (b1 !== b2) return b2 - b1;
    if (c1 !== c2) return c2 - c1;

    return 0;
};

export const getEventAddedVersion = (e: EventDoc): string | undefined =>
    e.changelog?.addedInVersion;

export const getEventUpdatedVersion = (e: EventDoc): string | undefined =>
    e.changelog?.lastUpdatedInVersion ?? e.changelog?.addedInVersion;

/** Safe DOM id for scrolling to an event card. */
export const getEventId = (eventName: string): string => `event-${eventName.replace(/\//g, '-')}`;

export type VersionWithEvents = {
    version: string;
    events: EventDoc[];
};

/** Returns versions (desc by last updated) with events that were added or updated in that version. */
export const getVersionsWithEvents = (events: EventDoc[]): VersionWithEvents[] => {
    const versionToEvents = new Map<string, EventDoc[]>();

    for (const event of events) {
        const added = event.changelog?.addedInVersion;
        const updated = event.changelog?.lastUpdatedInVersion ?? added;

        if (added) {
            const list = versionToEvents.get(added) ?? [];
            list.push(event);
            versionToEvents.set(added, list);
        }
        if (updated && updated !== added) {
            const list = versionToEvents.get(updated) ?? [];
            list.push(event);
            versionToEvents.set(updated, list);
        }
    }

    const versions = Array.from(versionToEvents.keys()).sort(compareVersionsDesc);

    return versions.map(version => ({
        version,
        events: versionToEvents.get(version) ?? [],
    }));
};
