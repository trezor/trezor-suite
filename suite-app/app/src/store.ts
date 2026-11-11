// fixes bindActionCreators() https://github.com/reduxjs/redux-thunk/blob/e3d452948d5562b9ce871cc9391403219f83b4ff/extend-redux.d.ts#L11
import {
    type Dispatch,
    type Middleware,
    type Reducer,
    type ReducersMapObject,
    type UnknownAction,
    combineReducers,
} from '@reduxjs/toolkit';

import { type BackupState, backupMiddleware, backupReducer } from '@suite/backup';
import { type DesktopBluetoothState, prepareDesktopBluetoothReducer } from '@suite/bluetooth';
import { type RecoveryState, recoveryReducer } from '@suite/recovery';
import { type DesktopSuiteSyncState, prepareSuiteSyncReducer } from '@suite/suite-sync';
import { type FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { type GeolocationState, geolocationReducer } from '@suite-common/geolocation';
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

const firmwareReducer = prepareFirmwareReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const bluetoothReducer = prepareDesktopBluetoothReducer(extraDependencies);
const thpReducer = prepareThpReducer(extraDependencies);
const suiteSyncReducer = prepareSuiteSyncReducer(extraDependencies);
const suiteSyncQuotaManagerReducer = prepareSuiteSyncQuotaManagerReducer(extraDependencies);
const receiveReducer = prepareReceiveReducer(extraDependencies);
const persistentDeviceDataReducer = preparePersistentDeviceDataReducer(extraDependencies);
const walletReducers = createWalletReducer(extraDependencies);

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
    receive: receiveReducer,
    wallet: walletReducers,
    earn: earnReducers,
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
    persistentDeviceData: persistentDeviceDataReducer,
} satisfies ReducersMapObject<AppState, never, Record<keyof AppState, never>>);

type GetCustomMiddlewareDeps = GetSuiteMiddlewareDeps & GetWalletMiddlewaresDeps;

export const getCustomMiddleware = (getExtra: () => GetCustomMiddlewareDeps | null) => {
    const middleware = [
        toastMiddleware,
        ...getSuiteMiddleware(getExtra),
        ...getWalletMiddlewares(getExtra),
        onboardingMiddleware,
        backupMiddleware,
    ];

    return middleware as Middleware<Dispatch, AppState>[];
};
