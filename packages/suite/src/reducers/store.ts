// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
import {
    type DevToolsEnhancerOptions,
    type Dispatch,
    type EnhancedStore,
    type Middleware,
    type MiddlewareAPI,
    type Reducer,
    type ReducersMapObject,
    type UnknownAction,
    combineReducers,
    configureStore,
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { type BackupState, backupMiddleware, backupReducer } from '@suite/backup';
import { MODAL_OPEN_USER_CONTEXT } from '@suite/modal';
import { type RecoveryState, recoveryReducer } from '@suite/recovery';
import { type HistoryDep } from '@suite/router';
import { type DesktopSuiteSyncState, prepareSuiteSyncReducer } from '@suite/suite-sync';
import { type GetTransportsFactoriesDep } from '@suite-common/connect-init';
import { type FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { type GeolocationState, geolocationReducer } from '@suite-common/geolocation';
import { addLog } from '@suite-common/logger';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type ReceiveState, prepareReceiveReducer } from '@suite-common/receive';
import { castExtraStore, createStoreWithExtraStoreMiddleware } from '@suite-common/redux-utils';
import { type SuiteSyncDataState, suiteSyncDataReducer } from '@suite-common/suite-sync';
import { type SuiteSyncQuotaManagerState } from '@suite-common/suite-sync-quota-manager';
import { type ReloadAppDep } from '@suite-common/suite-types';
import { type ThpHostNameDep, type ThpState, prepareThpReducer } from '@suite-common/thp';
import {
    type TokenDefinitionsState,
    prepareTokenDefinitionsReducer,
} from '@suite-common/token-definitions';
import { isCodesignBuild } from '@trezor/env-utils';
import { mergeDeepObject } from '@trezor/utils';

import { suiteSyncQuotaManagerSlice } from 'src/actions/suiteSyncQuotaManager/suiteSyncQuotaManagerSlice';
import onboardingMiddlewares from 'src/middlewares/onboarding';
import { type GetSuiteMiddlewareDeps, getSuiteMiddleware } from 'src/middlewares/suite';
import { toastMiddleware } from 'src/middlewares/suite/toastMiddleware';
import { type GetWalletMiddlewaresDeps, getWalletMiddlewares } from 'src/middlewares/wallet';
import onboardingReducers from 'src/reducers/onboarding';
import { type OnboardingState } from 'src/reducers/onboarding/onboardingReducer';
import { type SuiteReducersState, suiteReducers } from 'src/reducers/suite';
import { type WalletState, walletReducers } from 'src/reducers/wallet';
import {
    type GlobalSendReceiveFiltersState,
    globalSendReceiveFiltersReducer,
} from 'src/slices/wallet/globalSendReceiveFilters';
import type { PreloadStoreAction } from 'src/support/suite/preloadStore';
import { type Action } from 'src/types/suite';

import { type BioAuthState, prepareBioAuthReducer } from './bioAuth';
import { type DesktopState, desktopReducer } from './desktop';
import {
    type DesktopBluetoothState,
    prepareDesktopBluetoothReducer,
} from '../actions/bluetooth/desktopBluetoothReducer';
import { type CreateConnectLoggerFactoryDep } from '../support/createConnectLoggerFactory';
import { type CreateGetBinFilesBaseUrlDep } from '../support/createGetBinFilesBaseUrl';
import {
    type SuiteExtra,
    type SuiteServices,
    createSuiteServicesCompositionRoot,
    extraDependencies,
} from '../support/extraDependencies';

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const bluetoothReducer = prepareDesktopBluetoothReducer(extraDependencies);
const thpReducer = prepareThpReducer(extraDependencies);
const suiteSyncReducer = prepareSuiteSyncReducer(extraDependencies);
const suiteSyncQuotaManagerReducer = suiteSyncQuotaManagerSlice.prepareReducer(extraDependencies);
const receiveReducer = prepareReceiveReducer(extraDependencies);

export type AppState = SuiteReducersState & {
    onboarding: OnboardingState;
    receive: ReceiveState;
    wallet: WalletState;
    recovery: RecoveryState;
    firmware: FirmwareUpdateState;
    backup: BackupState;
    desktop: DesktopState;
    bioAuth: BioAuthState;
    tokenDefinitions: Partial<TokenDefinitionsState>;
    bluetooth: DesktopBluetoothState;
    thp: ThpState;
    suiteSync: DesktopSuiteSyncState;
    suiteSyncQuotaManager: SuiteSyncQuotaManagerState;
    suiteSyncData: SuiteSyncDataState;
    geolocation: GeolocationState;
    globalSendReceiveFilters: GlobalSendReceiveFiltersState;
};

const rootReducer = combineReducers({
    ...suiteReducers,
    onboarding: onboardingReducers,
    receive: receiveReducer,
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
    globalSendReceiveFilters: globalSendReceiveFiltersReducer,
} satisfies ReducersMapObject<AppState, never, Record<keyof AppState, never>>);

const loggerExcludedActions = [addLog.type];

type GetCustomMiddlewareDeps = GetSuiteMiddlewareDeps & GetWalletMiddlewaresDeps;

const getCustomMiddleware = (getExtra: () => GetCustomMiddlewareDeps | null) => {
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
            !loggerExcludedActions.includes(action.type);

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

export type SuiteStoreDeps = HistoryDep &
    PlatformEncryptionDep &
    CreateConnectLoggerFactoryDep &
    CreateGetBinFilesBaseUrlDep<AppState> &
    ReloadAppDep &
    ThpHostNameDep &
    GetTransportsFactoriesDep;

export type SuiteStore = ReturnType<
    typeof castExtraStore<SuiteExtra, EnhancedStore<AppState, Action | UnknownAction>>
> & {
    services: SuiteServices;
};

export const initStore = (
    deps: SuiteStoreDeps,
    preloadStoreAction?: PreloadStoreAction,
    options: { statePatch?: Record<string, any> } = {},
): SuiteStore => {
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
            history: deps.history,
            platformEncryption: deps.platformEncryption,
            reloadApp: deps.reloadApp,
            createLogger: deps.createConnectLoggerFactory?.({ getState: api.getState }),
            getBinFilesBaseUrl: deps.createGetBinFilesBaseUrl({ getState: api.getState }),
            thpHostName: deps.thpHostName,
            getTransportsFactories: deps.getTransportsFactories,
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
