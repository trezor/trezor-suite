// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
import {
    type DevToolsEnhancerOptions,
    type Dispatch,
    type Middleware,
    type Reducer,
    type ReducersMapObject,
    type UnknownAction,
    combineReducers,
} from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { type BackupState, backupMiddleware, backupReducer } from '@suite/backup';
import { type DesktopBluetoothState, prepareDesktopBluetoothReducer } from '@suite/bluetooth';
import { type RecoveryState, recoveryReducer } from '@suite/recovery';
import { type DesktopSuiteSyncState, prepareSuiteSyncReducer } from '@suite/suite-sync';
import { type FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { type GeolocationState, geolocationReducer } from '@suite-common/geolocation';
import { addLog } from '@suite-common/logger';
import { type NetworksState, networksReducer } from '@suite-common/networks';
import {
    type PersistentDeviceDataState,
    preparePersistentDeviceDataReducer,
} from '@suite-common/persistent-device-data';
import { type ReceiveState, prepareReceiveReducer } from '@suite-common/receive';
import { type SuiteSyncDataState, suiteSyncDataReducer } from '@suite-common/suite-sync';
import { type SuiteSyncQuotaManagerState } from '@suite-common/suite-sync-quota-manager';
import { type ThpState, prepareThpReducer } from '@suite-common/thp';
import {
    type TokenDefinitionsState,
    prepareTokenDefinitionsReducer,
} from '@suite-common/token-definitions';
import { isCodesignBuild } from '@trezor/env-utils';
import {
    type BioAuthState,
    type DesktopState,
    type GlobalSendReceiveFiltersState,
    type OnboardingState,
    type WalletState,
    createWalletReducer,
    desktopReducer,
    globalSendReceiveFiltersReducer,
    onboardingMiddleware,
    onboardingReducers,
    prepareBioAuthReducer,
    prepareSuiteSyncQuotaManagerReducer,
    toastMiddleware,
} from '@trezor/suite';

import { extraDependencies } from './extraDependencies';
import { type GetSuiteMiddlewareDeps, getSuiteMiddleware } from './middlewares/suite';
import { type GetWalletMiddlewaresDeps, getWalletMiddlewares } from './middlewares/wallet';
import { type EarnState, earnReducers } from './reducers/earn';
import { type SuiteReducersState, suiteReducers } from './reducers/suite';

export type AppState = SuiteReducersState & {
    networks: NetworksState;
    onboarding: OnboardingState;
    receive: ReceiveState;
    wallet: WalletState;
    earn: EarnState;
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
    persistentDeviceData: PersistentDeviceDataState;
};

export type SuiteRootReducer = Reducer<AppState, UnknownAction, Partial<AppState>>;

export const rootReducer: SuiteRootReducer = combineReducers({
    ...suiteReducers,
    networks: networksReducer,
    onboarding: onboardingReducers,
    receive: prepareReceiveReducer(extraDependencies),
    wallet: createWalletReducer(extraDependencies),
    earn: earnReducers,
    recovery: recoveryReducer,
    firmware: prepareFirmwareReducer(extraDependencies),
    backup: backupReducer,
    desktop: desktopReducer,
    bioAuth: prepareBioAuthReducer(extraDependencies),
    tokenDefinitions: prepareTokenDefinitionsReducer(extraDependencies),
    bluetooth: prepareDesktopBluetoothReducer(extraDependencies),
    thp: prepareThpReducer(extraDependencies),
    suiteSync: prepareSuiteSyncReducer(extraDependencies),
    suiteSyncQuotaManager: prepareSuiteSyncQuotaManagerReducer(extraDependencies),
    suiteSyncData: suiteSyncDataReducer,
    geolocation: geolocationReducer,
    globalSendReceiveFilters: globalSendReceiveFiltersReducer,
    persistentDeviceData: preparePersistentDeviceDataReducer(extraDependencies),
} satisfies ReducersMapObject<AppState, never, Record<keyof AppState, never>>);

const loggerExcludedActions = [addLog.type];

type GetCustomMiddlewareDeps = GetSuiteMiddlewareDeps & GetWalletMiddlewaresDeps;

export const getCustomMiddleware = (getExtra: () => GetCustomMiddlewareDeps | null) => {
    const middleware = [
        toastMiddleware,
        ...getSuiteMiddleware(getExtra),
        ...getWalletMiddlewares(getExtra),
        onboardingMiddleware,
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

export const devTools: DevToolsEnhancerOptions | false =
    typeof window === 'object' &&
    '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__' in window &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? {
              actionsDenylist: loggerExcludedActions,
          }
        : false;
