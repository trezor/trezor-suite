import {
    type DynamicMiddlewareInstance,
    configureStore,
    createDynamicMiddleware,
} from '@reduxjs/toolkit';

import { MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { type ExtraDependenciesStatic } from '@suite-common/extra-dependencies';
import { type ReduxStoreWithThunk, createReduxExtra } from '@suite-common/redux-utils';
import { type TokenDefinitionsMiddlewareDeps } from '@suite-common/token-definitions';
import { typedObjectKeys, typedObjectTransformValues } from '@trezor/utils';

import { type SuiteMiddlewares } from 'src/middlewares/suiteMiddlewares';
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
    /** Call once during startup, before dispatching application actions. */
    injectMiddlewares: (middlewares: SuiteMiddlewares) => void;
};

export type ReduxStoreDep = { reduxStore: ReduxStore };

export const createReduxStore = (deps: ReduxStoreDeps): ReduxStore => {
    const { getExtra, thunkMiddleware, injectServicesIntoReduxExtra } = createReduxExtra<
        AppState,
        SuiteServices,
        ExtraDependenciesStatic & TokenDefinitionsMiddlewareDeps
    >({ extraDependencies: deps.extraDependencies });

    const middlewareSlots: Record<keyof SuiteMiddlewares, DynamicMiddlewareInstance<AppState>> = {
        bluetoothMiddleware: createDynamicMiddleware<AppState>(),
    };
    const middlewares = typedObjectTransformValues(middlewareSlots, slot => slot.middleware);

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
                .concat(getCustomMiddleware({ getExtra, middlewares })),
        devTools,
    });

    return {
        store,
        injectServicesIntoReduxExtra,
        injectMiddlewares: injectedMiddlewares => {
            for (const name of typedObjectKeys(middlewareSlots)) {
                middlewareSlots[name].addMiddleware(injectedMiddlewares[name]);
            }
        },
    };
};
