import type { Store as ReduxStore } from 'redux';

import type { SuiteServices } from 'src/support/extraDependencies';
import type { Action, AppState } from 'src/types/suite';

import { useStore } from './useStore';

type SuiteStoreWithServices = ReduxStore<AppState, Action> & {
    services: SuiteServices;
};

export const useSuiteServices = () => (useStore() as SuiteStoreWithServices).services;
