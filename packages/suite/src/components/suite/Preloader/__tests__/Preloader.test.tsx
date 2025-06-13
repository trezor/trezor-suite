import { screen } from '@testing-library/react';

import { AnalyticsState } from '@suite-common/analytics';
import { FirmwareUpdateState } from '@suite-common/firmware/libDev/src';
import { MetadataState } from '@suite-common/metadata-types/libDev/src';
import { DeviceReducerState } from '@suite-common/wallet-core';
import { TransportInfo } from '@trezor/connect';
import * as envUtils from '@trezor/env-utils';
import { TorStatus } from '@trezor/suite-desktop-api';
import { DeepPartial } from '@trezor/type-utils';

import { desktopUpdateInitialState } from 'src/reducers/suite/desktopUpdateReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { findByTestId, renderWithProviders } from 'src/support/tests/hooksHelper';

import { LOCK_TYPE } from '../../../../actions/suite/constants/suiteConstants';
import { BackupState } from '../../../../reducers/backup/backupReducer';
import { OnboardingState } from '../../../../reducers/onboarding/onboardingReducer';
import { AppState } from '../../../../reducers/store';
import { ProtocolState } from '../../../../reducers/suite/protocolReducer';
import { RouterState } from '../../../../reducers/suite/routerReducer';
import { SuiteState } from '../../../../reducers/suite/suiteReducer';
import WalletReducers from '../../../../reducers/wallet';
import { TranslationKey } from '../../Translation';
import { Preloader } from '../Preloader';

// render only Translation.id in data-test attribute
jest.mock('src/components/suite/Translation', () => ({
    Translation: ({ id }: any) => <span data-testid={id}>{id}</span>,
}));

// @trezor/connect fetching ethereum definitions

// Preloader/LottieAnimation fetch videos
jest.mock('cross-fetch', () => ({
    __esModule: true,
    default: () => Promise.resolve({ ok: false }),
}));

// mock desktopApi
jest.mock('@trezor/suite-desktop-api', () => ({
    __esModule: true,
    desktopApi: {
        getBridgeStatus: () =>
            Promise.resolve({ success: true, payload: { service: true, process: true } }),
        getBridgeSettings: () => Promise.resolve({ success: true, payload: { enabled: true } }),
        on: (_event: string, _cb: any) => {},
        removeAllListeners: (_event: string) => {},
    },
}));

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isLinux: () => true,
}));

const createTransportInfo = (transportInfo: Partial<TransportInfo>): TransportInfo => ({
    type: 'NodeUsbTransport',
    apiType: 'usb',
    version: '',
    outdated: false,
    ...transportInfo,
});

type GetInitialStateProps = {
    suite?: Partial<SuiteState>;
    router?: Partial<RouterState>;
    // I am not happy about `DeepPartial` here, but it would be hell to fix all the fixtures
    device?: DeepPartial<DeviceReducerState>;
    analytics?: Partial<AnalyticsState>;
};

const getInitialState = ({
    suite,
    router,
    device,
    analytics,
}: GetInitialStateProps = {}): AppState => ({
    suite: {
        lifecycle: {
            status: 'ready',
        },
        transport: { transports: [] },
        settings: {
            debug: {
                showDebugMenu: false,
                transports: [],
                isUnlockedBootloaderAllowed: false,
                showConnectLogs: false,
            },
            theme: { variant: 'light' },
            enabledSecurityChecks: {
                deviceAuthenticity: true,
                entropy: true,
                firmwareRevision: true,
                firmwareHash: true,
            },
            language: 'id',
            torOnionLinks: false,
            isCoinjoinReceiveWarningHidden: false,
            isDesktopSuitePromoHidden: false,
            autodetect: {
                language: true,
                theme: true,
            },
            addressDisplayType: 'original',
            defaultWalletLoading: 'passphrase',
            sidebarWidth: 0,
            isCoinsFilterVisible: false,
        },
        online: true,
        locks: {
            [LOCK_TYPE.UI]: 0,
            [LOCK_TYPE.ROUTER]: 0,
            [LOCK_TYPE.DEVICE]: 0,
        },
        flags: {
            initialRun: false,
            taprootBannerClosed: false,
            firmwareTypeBannerClosed: false,
            discreetModeCompleted: false,
            securityStepsHidden: false,
            dashboardGraphHidden: false,
            dashboardAssetsGridMode: false,
            showDashboardT3T1PromoBanner: false,
            showSettingsDesktopAppPromoBanner: false,
            stakeEthBannerClosed: false,
            stakeSolBannerClosed: false,
            showDashboardStakingPromoBanner: false,
            isDashboardPassphraseBannerVisible: false,
            viewOnlyPromoClosed: false,
            viewOnlyTooltipClosed: false,
            suspiciousTransactionsTooltipClosed: false,
            showUnhideTokenModal: false,
            showCopyAddressModal: false,
            enableAutoupdateOnNextRun: false,
            isBluetoothEnabled: false,
            showBluetoothDebugInfo: false,
            stellarLimitedHistoryBannerClosed: false,
        },
        torStatus: 'Disabled' as TorStatus.Disabled,
        torBootstrap: null,
        evmSettings: {
            confirmExplanationModalClosed: {},
            explanationBannerClosed: {},
        },
        dismissedTradingTerms: {},
        countryCode: null,
        prefillFields: {},
        ...suite,
    },
    device: {
        devices: [],
        ...device,
    } as DeviceReducerState, // Todo: maybe one day, fix types
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
    messageSystem: {
        config: {
            actions: [],
            version: 0,
            timestamp: '',
            sequence: 0,
        },
        validMessages: {
            banner: [],
            context: [],
            modal: [],
            feature: [],
        },
        currentSequence: 0,
        timestamp: 0,
        dismissedMessages: {},
        validExperiments: [],
    },
    modal: {
        context: '@modal/context-none',
    },
    notifications: [],
    wallet: {
        discovery: {},
        accountSearch: {},
        settings: {},
        blockchain: {},
    } as ReturnType<typeof WalletReducers>, // Todo: maybe one day, fix types
    desktopUpdate: desktopUpdateInitialState,
    router: {
        app: 'suite-index',
        loaded: true,
        route: '/dashboard',
        ...router,
    } as RouterState, // Todo: maybe one day, fix types
    recovery: {
        advancedRecovery: false,
        wordsCount: 12,
        status: 'initial',
    },
    analytics: { confirmed: true, ...analytics },
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
});

const mockStore = configureStore<AppState, any>();

const initStore = (state: AppState) => mockStore(state);

const Index = ({ app }: any) => <Preloader>{app || 'foo'}</Preloader>;

const deviceCompromisedFixtures: Array<{
    description: string;
    device: DeepPartial<DeviceReducerState>;
    result: TranslationKey;
}> = [
    {
        description: 'Failed entropy check',
        device: {
            devicesWithFailedEntropyCheck: ['deviceId'],
            selectedDevice: {
                id: 'deviceId',
            },
        },
        result: 'TR_DEVICE_COMPROMISED_ENTROPY_CHECK_TEXT',
    },
    {
        description: 'Failed firmware hash check',
        device: {
            selectedDevice: {
                authenticityChecks: {
                    firmwareHash: {
                        error: 'hash-mismatch',
                    },
                },
                features: {},
            },
        },
        result: 'TR_DEVICE_COMPROMISED_FW_HASH_CHECK_TEXT',
    },
    {
        description: 'Failed firmware revision check',
        device: {
            selectedDevice: {
                authenticityChecks: {
                    firmwareRevision: {
                        error: 'revision-mismatch',
                    },
                },
                features: {},
            },
        },
        result: 'TR_DEVICE_COMPROMISED_FW_REVISION_CHECK_TEXT',
    },
];

describe('Preloader component', () => {
    beforeAll(() => {
        const originalWarn = console.warn;

        jest.spyOn(console, 'warn').mockImplementation((...args) => {
            const warningMessage = args[0];

            if (
                (typeof warningMessage === 'string' &&
                    warningMessage.startsWith('Firmware hash check failed!')) ||
                warningMessage.startsWith('Firmware revision check failed')
            ) {
                return;
            }

            originalWarn(...args);
        });
    });

    it('Loading: suite is loading', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    lifecycle: {
                        status: 'loading',
                    },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('Loading: router is loading', () => {
        const store = initStore(
            getInitialState({
                router: {
                    loaded: false,
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('Loading: transport is not set yet', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: undefined,
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('No transport', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);
        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_NO_TRANSPORT')).not.toBeNull();

        unmount();
    });

    it('Bridge transport, no device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_STILL_DONT_SEE_YOUR_TREZOR/)).not.toBeNull();

        unmount();
    });

    it('WebUSB transport, no device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'WebUsbTransport' })] },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('web-usb-button')).not.toBeNull();

        unmount();
    });

    it('Unacquired device', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                transportSessionOwner: 'foo',
                type: 'unacquired',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(screen.getAllByText('TR_ACQUIRE_DEVICE_TITLE').length).toBe(2);

        unmount();
    });

    it('Unreadable device: webusb HID', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                type: 'unreadable',
                error: 'unable to open device',
                hid: true,
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'WebUsbTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on Linux', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => true);

        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                type: 'unreadable',
                error: 'LIBUSB_ERROR_ACCESS',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-udev')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on non-Linux os (should never happen)', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => false);

        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                type: 'unreadable',
                error: 'LIBUSB_ERROR_ACCESS',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: unknown error', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                type: 'unreadable',
                error: 'Unexpected error',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unknown device (should never happen)', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                transportSessionOwner: 'foo',
                features: undefined,
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_UNKNOWN_DEVICE/)).not.toBeNull();

        unmount();
    });

    it('Seedless device', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                mode: 'seedless',
                features: {},
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_YOUR_DEVICE_IS_SEEDLESS/)).not.toBeNull();
        expect(findByTestId('TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE')).not.toBeNull();

        unmount();
    });

    it('Recovery mode device', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                features: { recovery_status: 'Recovery' },
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_RECOVERY_MODE/)).not.toBeNull();
        expect(findByTestId('TR_CONTINUE')).not.toBeNull();

        unmount();
    });

    it('Not initialized device', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                mode: 'initialize',
                features: {},
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_NOT_INITIALIZED/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('Bootloader device with installed firmware', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                mode: 'bootloader',
                features: { firmware_present: true },
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_BOOTLOADER/)).not.toBeNull();
        expect(findByTestId('TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT')).not.toBeNull();

        unmount();
    });

    it('Bootloader device without firmware', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                mode: 'bootloader',
                features: { firmware_present: false },
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_NO_FIRMWARE/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('Required FW update device', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                firmware: 'required',
                features: {},
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/FW_CAPABILITY_UPDATE_REQUIRED/)).not.toBeNull();
        expect(findByTestId('TR_SEE_DETAILS')).not.toBeNull();

        unmount();
    });

    deviceCompromisedFixtures.forEach(({ description, device, result }) => {
        it(description, () => {
            const store = initStore(getInitialState({ device }));
            const { getByText, unmount } = renderWithProviders(
                store,
                <Index app={store.getState().router.app} />,
            );

            expect(getByText(result)).not.toBeNull();

            unmount();
        });
    });
});
