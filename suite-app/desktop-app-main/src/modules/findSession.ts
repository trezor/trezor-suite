import { type FindResult } from '@suite/desktop-app-api';

export type FindSession = {
    query: string;
    requestId: number;
};

export type FindContents = {
    findInPage: (text: string, options?: { forward?: boolean; findNext?: boolean }) => number;
    stopFindInPage: (action: 'clearSelection' | 'keepSelection' | 'activateSelection') => void;
};

export type ReportedFindResult = {
    requestId: number;
    matches: number;
    activeMatchOrdinal: number;
    finalUpdate: boolean;
};

const idleSession = (): FindSession => ({ query: '', requestId: 0 });

export const startFind = (contents: FindContents, query: string): FindSession => {
    if (!query) {
        contents.stopFindInPage('clearSelection');

        return idleSession();
    }

    // Omitting options keeps Chromium's new_session default, so this starts a fresh search.
    return { query, requestId: contents.findInPage(query) };
};

export const continueFind = (
    session: FindSession,
    contents: FindContents,
    forward: boolean,
): FindSession => {
    if (!session.query) return session;

    // Electron copies findNext into Chromium's new_session flag. Follow-up calls must pass
    // false, otherwise the search restarts at the first match instead of moving.
    return {
        query: session.query,
        requestId: contents.findInPage(session.query, { forward, findNext: false }),
    };
};

export const stopFind = (contents: FindContents): FindSession => {
    contents.stopFindInPage('clearSelection');

    return idleSession();
};

export const getFindResult = (
    session: FindSession,
    reported: ReportedFindResult,
): FindResult | null => {
    const isCurrentResult =
        session.requestId !== 0 && reported.finalUpdate && reported.requestId === session.requestId;

    if (!isCurrentResult) return null;

    return {
        matches: reported.matches,
        activeMatchOrdinal: reported.activeMatchOrdinal,
    };
};
