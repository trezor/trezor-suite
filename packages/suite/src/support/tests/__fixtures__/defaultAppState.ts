import { FirmwareUpdateState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { MetadataState } from '@suite-common/metadata-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { deviceReducerInitialState } from '@suite-common/wallet-core';

import { BackupState } from 'src/reducers/backup/backupReducer';
import { OnboardingState } from 'src/reducers/onboarding/onboardingReducer';
import { AppState } from 'src/reducers/store';
import { desktopUpdateInitialState } from 'src/reducers/suite/desktopUpdateReducer';
import { ProtocolState } from 'src/reducers/suite/protocolReducer';
import { RouterState } from 'src/reducers/suite/routerReducer';
import { suiteInitialState } from 'src/reducers/suite/suiteReducer';
import WalletReducers from 'src/reducers/wallet';

export const initialAppState: AppState = {
    suite: suiteInitialState,
    device: deviceReducerInitialState,
    bluetooth: {
        unpairedDeviceNeedsManualOsRemoval: false,
        isBluetoothListOpen: false,
        connectingDeviceIds: [],
        isUnpairingDevice: false,
        adapterStatus: 'unknown',
        scanStatus: 'error',
        nearbyDevices: null,
        knownDevices: [],
    },
    thp: {
        step: null,
        lastThpCode: undefined,
        credentials: [],
    },
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
        url: '/suite-web/develop/web/',
        pathname: '/suite-web/develop/web/',
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
        initialNow: 0,
        bioAuthEnabled: false,
        blurTimeoutId: null,
        bioAuthEnabledNextValue: null,
        lastBioAuthValidatedTimestamp: null,
        lastWindowBlurTimestamp: null,
        bioAuthValidationInProgress: false,
        bioAuthValidationRequested: false,
        bioAuthValidationRequired: false,
        windowBlurred: false,
        bioAuthAvailable: null,
        hasEverValidatedBioAuth: false,
    },
};
