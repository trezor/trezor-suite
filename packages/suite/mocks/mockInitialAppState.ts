import type { BackupState } from '@suite/backup';
import { initialDesktopBluetoothState } from '@suite/bluetooth';
import { debugInitialState } from '@suite/debug';
import { desktopUpdateInitialState } from '@suite/desktop-update';
import { initialState } from '@suite/device';
import { initialState as featureFeedbackInitialState } from '@suite/feature-feedback';
import { flagsInitialState } from '@suite/flags';
import { type TranslationKey } from '@suite/intl';
import { locksInitialState } from '@suite/locks';
import { type State as ModalState } from '@suite/modal';
import { type RecoveryState } from '@suite/recovery';
import { type RouterState } from '@suite/router';
import { suiteSettingsInitialState } from '@suite/settings';
import { initialSuiteSyncDesktopState } from '@suite/suite-sync';
import { type TorState, TorStatus } from '@suite/tor';
import { type AnalyticsState } from '@suite-common/analytics-redux';
import { type ConnectPopupState } from '@suite-common/connect-popup';
import { stakingInitialState } from '@suite-common/earn-staking';
import { type FirmwareUpdateState } from '@suite-common/firmware';
import { type GeolocationState } from '@suite-common/geolocation';
import { type LogsSliceState } from '@suite-common/logger';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type MetadataState } from '@suite-common/metadata-types';
import { type NetworksState } from '@suite-common/networks';
import { persistentDeviceDataInitialState } from '@suite-common/persistent-device-data';
import { receiveInitialState } from '@suite-common/receive';
import { type SuiteSyncDataState } from '@suite-common/suite-sync';
import { quotaManagerInitialState } from '@suite-common/suite-sync-quota-manager';
import { type ThpState } from '@suite-common/thp';
import { type NotificationsState } from '@suite-common/toast-notifications';
import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import { type WalletConnectState } from '@suite-common/walletconnect';

import { type DesktopState } from '#src/reducers/desktop/desktopReducer';
import { type OnboardingState } from '#src/reducers/onboarding/onboardingState';
import { type GuideState } from '#src/reducers/suite/guideState';
import { type ProtocolState } from '#src/reducers/suite/protocolState';
import { suiteInitialState } from '#src/reducers/suite/suiteReducer';
import { createWalletReducer } from '#src/reducers/wallet/walletReducer';
import { type GlobalSendReceiveFiltersState } from '#src/slices/wallet/globalSendReceiveFilters';

import { mockExtraDependenciesForReducers } from './mockExtraDependenciesForReducers';

const walletReducers = createWalletReducer(mockExtraDependenciesForReducers);

/**
 * @deprecated Construct state in each test with only the slices it needs, typed against the
 * feature's state contract. This shared fixture is retained for existing tests.
 */
export const mockInitialAppState = {
    networks: null as NetworksState,
    suite: suiteInitialState,
    discreetMode: {
        isActive: false,
    },
    tor: {
        torStatus: TorStatus.Disabled,
        torBootstrap: null,
    } as TorState,
    suiteSettings: suiteSettingsInitialState,
    debug: debugInitialState,
    flags: flagsInitialState,
    locks: locksInitialState,
    device: initialState,
    bluetooth: initialDesktopBluetoothState,
    thp: {
        step: null,
        autoconnectStep: null,
        lastThpCode: undefined,
        credentials: [],
    } as ThpState,
    suiteSyncData: {
        wallets: {},
    } as SuiteSyncDataState,
    suiteSync: initialSuiteSyncDesktopState,
    suiteSyncQuotaManager: quotaManagerInitialState,
    window: {
        isVisible: true,
        isBelowMobile: false,
        isBelowTablet: false,
        isBelowLaptop: false,
        isBelowDesktop: false,
        isAboveMobile: false,
        isAboveTablet: false,
        isAboveLaptop: false,
        isAboveDesktop: false,
    },
    guide: {
        open: false,
        view: 'GUIDE_DEFAULT',
        indexNode: null,
        currentNode: null,
        width: 350,
    } as GuideState,
    messageSystem: messageSystemInitialState,
    modal: {
        context: '@modal/context-none',
    } as ModalState,
    notifications: [] as NotificationsState<TranslationKey>,
    receive: receiveInitialState,
    persistentDeviceData: persistentDeviceDataInitialState,
    wallet: walletReducers(undefined, { type: '@@INIT' }),
    earn: { staking: stakingInitialState },
    desktopUpdate: desktopUpdateInitialState,
    router: {
        loaded: true,
        pathname: '/suite-web/develop/web/' as RouterState['pathname'],
        hash: '',
        search: '',
        app: 'dashboard',
        route: {
            name: 'suite-index',
            pattern: '/',
            app: 'dashboard',
        },
        settingsBackRoute: {
            name: 'suite-index',
        },
    } as RouterState, // TODO: this is state copied from actual app runtime, so how can there be type error???
    recovery: {
        recoveryInputType: 'standard',
        wordsCount: 12,
        status: 'initial',
    } as RecoveryState,
    analytics: { confirmed: true } as AnalyticsState,
    onboarding: {} as OnboardingState, // Todo: maybe one day, fix types
    firmware: {} as FirmwareUpdateState, // Todo: maybe one day, fix types
    backup: {} as BackupState, // Todo: maybe one day, fix types
    desktop: null as DesktopState,
    tokenDefinitions: {} as Partial<TokenDefinitionsState>,
    geolocation: {
        countryCode: null,
    } as GeolocationState,
    logs: {
        logEntries: [],
    } as LogsSliceState,
    metadata: {} as MetadataState, // Todo: maybe one day, fix types
    protocol: {} as ProtocolState, // Todo: maybe one day, fix types
    connectPopup: {
        activeCall: undefined,
        permissions: [],
    } as ConnectPopupState,
    walletConnect: {
        sessions: [],
        pendingProposal: undefined,
    } as WalletConnectState,
    bioAuth: {
        bioAuthEnabled: false,
        bioAuthAvailable: false,
        bioAuthValidationRequired: false,
        cancelled: false,
    },
    globalSendReceiveFilters: {
        search: '',
        networkSymbol: undefined,
    } as GlobalSendReceiveFiltersState,
    featureFeedback: featureFeedbackInitialState,
};

/**
 * @deprecated Use the tested feature's state contract. This type describes the legacy shared
 * fixture, not the application state.
 */
export type MockSuiteState = typeof mockInitialAppState;
