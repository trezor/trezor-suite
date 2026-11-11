import { configureStore } from '@reduxjs/toolkit';

import { MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { type ExtraDependenciesStatic } from '@suite-common/extra-dependencies';
import { type TokenDefinitionsMiddlewareDeps } from '@suite-common/token-definitions';
import { isCodesignBuild } from '@trezor/env-utils';
import { type ReduxStoreWithThunk, createReduxExtra } from '@trezor/redux-utils';

import {
    type ReduxLoggerControl,
    type ReduxLoggerStorage,
    createReduxLogger,
} from './createReduxLogger';
import { type ExtraDependenciesSuite } from './extraDependencies';
import {
    type AppState,
    type SuiteRootReducer,
    devTools,
    getCustomMiddleware,
    loggerExcludedActions,
} from './store';
import { type SuiteServices } from './suiteServices';

export type ReduxStoreDeps = {
    reducer: SuiteRootReducer;
    extraDependencies: ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps;
    reduxLoggerStorage: ReduxLoggerStorage;
};

export type SuiteReduxStore = ReduxStoreWithThunk<AppState, ExtraDependenciesSuite>;

export type SuiteReduxStoreDep = { store: SuiteReduxStore };

export type ReduxStore = {
    store: SuiteReduxStore;
    injectServicesIntoReduxExtra: (services: SuiteServices) => void;
    /** Only non-codesign builds have it; the composition root exposes it as a service and on window. */
    reduxLoggerControl?: ReduxLoggerControl;
};

export type ReduxStoreDep = { reduxStore: ReduxStore };

/** The build inlines `REDUX_LOGGER_ENABLED` as "true", "false" or "" (not set). */
const getReduxLoggerOverride = () => {
    switch (process.env.REDUX_LOGGER_ENABLED) {
        case 'true':
            return true;
        case 'false':
            return false;
        default:
            return undefined;
    }
};

export const createReduxStore = (deps: ReduxStoreDeps): ReduxStore => {
    const { getExtra, thunkMiddleware, injectServicesIntoReduxExtra } = createReduxExtra<
        AppState,
        SuiteServices,
        ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps
    >({ extraDependencies: deps.extraDependencies });

    const reduxLogger = isCodesignBuild()
        ? undefined
        : createReduxLogger({
              excludedActionTypes: loggerExcludedActions,
              reduxLoggerStorage: deps.reduxLoggerStorage,
              isEnabledOverride: getReduxLoggerOverride(),
          });
    const customMiddleware = getCustomMiddleware(getExtra);
    // The logger goes last so that it sees every action after the other middleware ran.
    const middleware = reduxLogger
        ? [...customMiddleware, reduxLogger.middleware]
        : customMiddleware;

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
                .concat(middleware),
        devTools,
    });

    return {
        store,
        injectServicesIntoReduxExtra,
        reduxLoggerControl: reduxLogger?.control,
    };
};
