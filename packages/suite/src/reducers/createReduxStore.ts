import { configureStore } from '@reduxjs/toolkit';

import { MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { type ExtraDependenciesStatic } from '@suite-common/extra-dependencies';
import { type ReduxStoreWithThunk, createReduxExtra } from '@suite-common/redux-utils';
import { type TokenDefinitionsMiddlewareDeps } from '@suite-common/token-definitions';

import { type SuiteServices } from 'src/support/createSuiteCompositionRoot';
import { type ExtraDependenciesSuite } from 'src/support/extraDependencies';

import { type AppState, type SuiteRootReducer, devTools, getCustomMiddleware } from './store';

type ReduxStoreDeps = {
    reducer: SuiteRootReducer;
    extraDependencies: ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps;
};

export type SuiteReduxStore = ReduxStoreWithThunk<AppState, ExtraDependenciesSuite>;

export type SuiteReduxStoreDep = { store: SuiteReduxStore };

export type ReduxStore = {
    store: SuiteReduxStore;
    injectServicesIntoReduxExtra: (services: SuiteServices) => void;
};

export type ReduxStoreDep = { reduxStore: ReduxStore };

export const createReduxStore = (deps: ReduxStoreDeps): ReduxStore => {
    const { getExtra, thunkMiddleware, injectServicesIntoReduxExtra } = createReduxExtra<
        AppState,
        SuiteServices,
        ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps
    >({ extraDependencies: deps.extraDependencies });

    const store = configureStore({
        reducer: deps.reducer,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: false,
                immutableCheck: false,
                serializableCheck: {
                    ignoredActions: [MODAL_OPEN_USER_CONTEXT],
                    ignoredPaths: [
                        'modal.payload.decision.promise',
                        'modal.payload.decision.resolve',
                        'modal.payload.decision.reject',
                    ],
                },
            })
                .prepend(thunkMiddleware)
                .concat(getCustomMiddleware(getExtra)),
        devTools,
    });

    return {
        store,
        injectServicesIntoReduxExtra,
    };
};
