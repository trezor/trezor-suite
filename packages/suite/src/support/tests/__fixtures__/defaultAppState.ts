import { initialState as experimentalFeedbackInitialState } from '@suite/experimental-feedback';
import { flagsInitialState } from '@suite/flags';
import { locksInitialState } from '@suite/locks';
import { RouterState } from '@suite/router';
import { FirmwareUpdateState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { MetadataState } from '@suite-common/metadata-types';
import { quotaManagerInitialState } from '@suite-common/suite-sync-quota-manager/src/quotaManagerReducer';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { initialState } from 'src/actions/device/deviceSlice';
import { initialSuiteSyncDesktopState } from 'src/actions/suiteSync/suiteSyncSlice';
import { BackupState } from 'src/reducers/backup/backupReducer';
import { OnboardingState } from 'src/reducers/onboarding/onboardingReducer';
import { AppState } from 'src/reducers/store';
import { desktopUpdateInitialState } from 'src/reducers/suite/desktopUpdateReducer';
import { ProtocolState } from 'src/reducers/suite/protocolReducer';
import { suiteInitialState } from 'src/reducers/suite/suiteReducer';
import WalletReducers from 'src/reducers/wallet';

import { initialDesktopBluetoothState } from '../../../actions/bluetooth/desktopBluetoothReducer';

export const initialAppState: AppState = {
    suite: suiteInitialState,
    flags: flagsInitialState,
    locks: locksInitialState,
    device: initialState,
    bluetooth: initialDesktopBluetoothState,
    thp: {
        step: null,
        autoconnectStep: null,
        lastThpCode: undefined,
        credentials: [],
    },
    suiteSyncData: {
        wallets: {},
    },
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
    },
    messageSystem: messageSystemInitialState,
    modal: {
        context: '@modal/context-none',
    },
    notifications: [],
    wallet: {
        discovery: {},
        accountSearch: {},
        settings: {
            enabledNetworks: [] as NetworkSymbol[],
        },
        blockchain: {},
    } as ReturnType<typeof WalletReducers>, // Todo: maybe one day, fix types
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
        advancedRecovery: false,
        wordsCount: 12,
        status: 'initial',
    },
    analytics: { confirmed: true },
    onboarding: {} as OnboardingState, // Todo: maybe one day, fix types
    firmware: {} as FirmwareUpdateState, // Todo: maybe one day, fix types
    backup: {} as BackupState, // Todo: maybe one day, fix types
    desktop: null,
    tokenDefinitions: {},
    geolocation: {
        countryCode: null,
    },
    logs: {
        logEntries: [],
    },
    metadata: {} as MetadataState, // Todo: maybe one day, fix types
    protocol: {} as ProtocolState, // Todo: maybe one day, fix types
    connectPopup: {
        activeCall: undefined,
        permissions: [],
    },
    walletConnect: {
        sessions: [],
        pendingProposal: undefined,
    },
    bioAuth: {
        bioAuthEnabled: false,
        bioAuthAvailable: false,
        bioAuthValidationRequired: false,
        cancelled: false,
    },
    globalSendReceiveFilters: {
        search: '',
        networkSymbol: undefined,
    },
    experimentalFeedback: experimentalFeedbackInitialState,
};
