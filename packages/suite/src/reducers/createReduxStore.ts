import { type Store, type UnknownAction, configureStore } from '@reduxjs/toolkit';
import { type ThunkDispatch, type ThunkMiddleware } from 'redux-thunk';

import { MODAL_OPEN_USER_CONTEXT } from '@suite/modal';

import { type SuiteServices } from 'src/support/createSuiteCompositionRoot';
import { type ExtraDependenciesSuite } from 'src/support/extraDependencies';

import { type AppState, type SuiteRootReducer, devTools, getCustomMiddleware } from './store';

type ReduxStoreDeps = {
    reducer: SuiteRootReducer;
    extraDependencies: Omit<ExtraDependenciesSuite, 'services'>;
};

export type SuiteReduxStore = Store<AppState> & {
    dispatch: ThunkDispatch<AppState, ExtraDependenciesSuite, UnknownAction>;
};

export type SuiteReduxStoreDep = { store: SuiteReduxStore };

export type ReduxStore = {
    store: SuiteReduxStore;
    injectServicesIntoReduxExtra: (services: SuiteServices) => void;
};

export type ReduxStoreDep = { reduxStore: ReduxStore };

export const createReduxStore = (deps: ReduxStoreDeps): ReduxStore => {
    let extra: ExtraDependenciesSuite | null = null;

    const getExtra = (): ExtraDependenciesSuite => {
        if (extra === null) {
            throw new Error(
                'Redux services must be injected before dispatching application actions.',
            );
        }

        return extra;
    };

    // Resolve extra at dispatch time: services need the real store to be constructed first.
    const thunkMiddleware: ThunkMiddleware<AppState, UnknownAction, ExtraDependenciesSuite> =
        ({ dispatch, getState }) =>
        next =>
        action => {
            const currentExtra = getExtra();

            if (typeof action === 'function') {
                return action(dispatch, getState, currentExtra);
            }

            return next(action);
        };

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
        injectServicesIntoReduxExtra: services => {
            // Services depend on this store's dispatch/getState, while thunks depend on services.
            // The parent composition root creates the store first, then builds and injects the
            // services here to break that cycle before any application actions are dispatched.
            extra = { ...deps.extraDependencies, services };
        },
    };
};
