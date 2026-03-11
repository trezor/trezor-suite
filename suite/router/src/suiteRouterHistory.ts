import { type History } from 'history';

import type { RouterPath } from './router';

export type LocationPushState = Record<string, unknown>;

// This is a Listener from history package
type Listener = (_: { location: RouterPath; action: 'PUSH' | 'POP' | 'REPLACE' }) => void;

export type SuiteRouterHistory = {
    getLocation: () => RouterPath;
    navigate: (to: Partial<RouterPath>, state?: LocationPushState) => void;
    // calling .listen(listener) returns a cleanup function
    listen: (listener: Listener) => () => void;
};

export type SuiteRouterHistoryDep = {
    suiteRouterHistory: SuiteRouterHistory;
};

export type SuiteRouterHistoryDeps = {
    history: History;
};

export type HistoryDep = {
    history: History;
};
