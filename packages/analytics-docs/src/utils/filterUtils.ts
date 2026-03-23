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

/** Token matches segment if equal or segment starts with token (user types prefix of a segment). */
const segmentMatchesToken = (segment: string, token: string): boolean =>
    segment === token || segment.startsWith(token);

export const fuzzyMatch = (query: string, haystack: string): boolean => {
    const tokens = query
        .toLowerCase()
        .trim()
        .split(/[\s_\-/]+/)
        .filter(Boolean);

    if (tokens.length === 0) return true;

    const segments = haystack
        .toLowerCase()
        .split(/[/_-]+/)
        .filter(Boolean);

    for (const token of tokens) {
        const found = segments.some(seg => segmentMatchesToken(seg, token));
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

/** Converts event name (e.g. "accounts/active-staking") to export name (e.g. "accountsActiveStakingEvent"). */
export const toEventExportName = (eventName: string): string =>
    eventName
        .split(/[/_-]+/)
        .map((part, index) =>
            index === 0
                ? part.toLowerCase()
                : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join('') + 'Event';

/** Splits camelCase string into words (e.g. "accountsActionsEvent" → ["accounts", "actions", "event"]). */
const splitCamelCase = (s: string): string[] =>
    s.split(/(?=[A-Z])/).map(part => part.toLowerCase());

/**
 * Matches query against export name by requiring each query token to equal
 * (or be a prefix of) the concatenation of one or more consecutive camelCase words.
 * So "accountsactions" matches "accountsActionsEvent"; "accountsActiveStakin"
 * matches "accountsActiveStakingEvent" (prefix of "accountsactivestaking").
 */
export const fuzzyMatchExportName = (query: string, exportName: string): boolean => {
    const tokens = query
        .toLowerCase()
        .trim()
        .split(/[\s_\-/]+/)
        .filter(Boolean);
    if (tokens.length === 0) return true;

    const words = splitCamelCase(exportName);
    for (const token of tokens) {
        let matched = false;
        for (let i = 0; i < words.length && !matched; i++) {
            let concat = '';
            for (let j = i; j < words.length; j++) {
                concat += words[j];
                if (concat === token || concat.startsWith(token)) {
                    matched = true;
                    break;
                }
                if (concat.length > token.length && !concat.startsWith(token)) break;
            }
        }
        if (!matched) return false;
    }

    return true;
};

export type VersionWithEvents = {
    version: string;
    events: EventDoc[];
};

/**
 * Returns versions (desc) with events that were changed in that version.
 *
 * Note: `attribute.changelog.entries` are merged into `event.changelog.entries` by `normalizeEvents()`,
 * so `event.changelog.entries` is the single source of truth here.
 */
export const getVersionsWithEvents = (events: EventDoc[]): VersionWithEvents[] => {
    const versionToEvents = new Map<string, EventDoc[]>();

    for (const event of events) {
        const seenVersions = new Set<string>();

        for (const entry of event.changelog?.entries ?? []) {
            const v = entry.version;
            if (!v || seenVersions.has(v)) continue;
            seenVersions.add(v);
            const list = versionToEvents.get(v) ?? [];
            list.push(event);
            versionToEvents.set(v, list);
        }
    }

    const versions = Array.from(versionToEvents.keys()).sort(compareVersionsDesc);

    return versions.map(version => ({
        version,
        events: versionToEvents.get(version) ?? [],
    }));
};
