// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
import {
    type DevToolsEnhancerOptions,
    type Dispatch,
    type Middleware,
    type MiddlewareAPI,
    type Reducer,
    combineReducers,
    configureStore,
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { backupMiddleware, backupReducer } from '@suite/backup';
import { MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { recoveryReducer } from '@suite/recovery';
import { type HistoryDep } from '@suite/router';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { geolocationReducer } from '@suite-common/geolocation';
import { addLog } from '@suite-common/logger';
import {
    type ExtraDependencies,
    castExtraStore,
    createStoreWithExtraStoreMiddleware,
} from '@suite-common/redux-utils';
import { suiteSyncDataReducer } from '@suite-common/suite-sync';
import { type SuiteSyncAppReloaderDep } from '@suite-common/suite-sync-types';
import { prepareThpReducer } from '@suite-common/thp';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { accountsActions } from '@suite-common/wallet-core';
import { isCodesignBuild } from '@trezor/env-utils';
import { mergeDeepObject } from '@trezor/utils';

import { suiteSyncSlice } from 'src/actions/suiteSync/suiteSyncSlice';
import { suiteSyncQuotaManagerSlice } from 'src/actions/suiteSyncQuotaManager/suiteSyncQuotaManagerSlice';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import { getSuiteMiddleware } from 'src/middlewares/suite';
import { toastMiddleware } from 'src/middlewares/suite/toastMiddleware';
import { getWalletMiddlewares } from 'src/middlewares/wallet';
import onboardingReducers from 'src/reducers/onboarding';
import suiteReducers from 'src/reducers/suite';
import walletReducers from 'src/reducers/wallet';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';

import { prepareBioAuthReducer } from './bioAuth';
import { desktopReducer } from './desktop';
import { bluetoothSlice } from '../actions/bluetooth/desktopBluetoothReducer';
import {
    createSuiteServicesCompositionRoot,
    extraDependencies,
} from '../support/extraDependencies';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const bluetoothReducer = bluetoothSlice.prepareReducer(extraDependencies);
const thpReducer = prepareThpReducer(extraDependencies);
const suiteSyncReducer = suiteSyncSlice.prepareReducer(extraDependencies);
const suiteSyncQuotaManagerReducer = suiteSyncQuotaManagerSlice.prepareReducer(extraDependencies);

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    wallet: walletReducers,
    recovery: recoveryReducer,
    firmware: firmwareReducer,
    backup: backupReducer,
    desktop: desktopReducer,
    bioAuth: prepareBioAuthReducer(extraDependencies),
    tokenDefinitions: tokenDefinitionsReducer,
    bluetooth: bluetoothReducer,
    thp: thpReducer,
    suiteSync: suiteSyncReducer,
    suiteSyncQuotaManager: suiteSyncQuotaManagerReducer,
    suiteSyncData: suiteSyncDataReducer,
    geolocation: geolocationReducer,
    globalSendReceiveFilters: globalSendReceiveFilters.reducer,
});

export type AppState = ReturnType<typeof rootReducer>;

const loggerExcludedActions = [addLog.type, accountsActions.updateAccountRefreshTimestamp.type];

const getCustomMiddleware = (getExtra: () => ExtraDependencies | null) => {
    const middleware = [
        toastMiddleware,
        ...getSuiteMiddleware(getExtra),
        ...getWalletMiddlewares(getExtra),
        ...onboardingMiddlewares,
        backupMiddleware,
    ];

    if (!isCodesignBuild()) {
        const excludeLogger = (_getState: any, action: any): boolean =>
            // exclude generated lifecycle actions
            // https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions
            !action?.meta?.requestId &&
            // explicitly excluded actions
            !loggerExcludedActions.some(act => action.type === act);

        const logger = createLogger({
            level: 'info',
            predicate: excludeLogger,
            collapsed: true,
        });
        middleware.push(logger);
    }

    return middleware as Middleware<Dispatch, AppState>[];
};

const devTools: DevToolsEnhancerOptions | false =
    typeof window === 'object' &&
    '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__' in window &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? {
              actionsDenylist: loggerExcludedActions,
          }
        : false;

const patchConfirm = (statePatch: any) =>
    !isCodesignBuild() ||
    confirm(
        `Trezor Suite is starting with partially predefined state. Press OK only if you intended to do that!\n\n` +
            JSON.stringify(statePatch, null, 4),
    );

type RootReducerShape = typeof rootReducer;
export type PreloadedState = Partial<AppState>;
type InferredAction = Parameters<RootReducerShape>[1];

export type SuiteStoreDeps = HistoryDep & SuiteSyncAppReloaderDep;

export const initStore = (
    deps: SuiteStoreDeps,
    preloadStoreAction?: PreloadStoreAction,
    options: { statePatch?: Record<string, any> } = {},
) => {
    // get initial state by calling STORAGE.LOAD action with optional payload
    // payload will be processed in each reducer explicitly
    const preloadedState = preloadStoreAction
        ? rootReducer(undefined, preloadStoreAction)
        : undefined;

    const patchedState =
        preloadedState && options?.statePatch && patchConfirm(options.statePatch)
            ? mergeDeepObject.withOptions(
                  { dotNotation: true },
                  preloadedState,
                  options.statePatch as Partial<AppState>,
              )
            : preloadedState;

    const extraFactory = (api: MiddlewareAPI) => ({
        ...extraDependencies,
        services: createSuiteServicesCompositionRoot({
            getState: api.getState,
            dispatch: api.dispatch,
            reloadApp: deps.reloadApp,
            history: deps.history,
        }),
    });

    let extra: ReturnType<typeof extraFactory> | null = null as ReturnType<
        typeof extraFactory
    > | null;

    const store = configureStore({
        reducer: rootReducer as Reducer<AppState, InferredAction, PreloadedState>,
        preloadedState: patchedState,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
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
                .prepend(
                    createStoreWithExtraStoreMiddleware({
                        extraFactory,
                        onExtraCreated: (initializedExtra: ReturnType<typeof extraFactory>) => {
                            extra = initializedExtra;
                        },
                    }),
                )
                .concat(getCustomMiddleware(() => extra)),
        devTools,
    } as const);

    const castedStore = castExtraStore(store, extra);

    return {
        ...castedStore,
        services: castedStore.extra.services,
    };
};
