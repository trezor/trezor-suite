import { screen } from '@testing-library/react';

import * as envUtils from '@trezor/env-utils';
import { DeepPartial } from '@trezor/type-utils';

import { desktopUpdateInitialState } from 'src/reducers/suite/desktopUpdateReducer';
import { configureStore } from 'src/support/tests/configureStore';
import { findByTestId, renderWithProviders } from 'src/support/tests/hooksHelper';

import { AppState } from '../../../../reducers/store';
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

const getInitialState = ({ suite, router, device }: any = {}) => ({
    suite: {
        lifecycle: {
            status: 'ready',
        },
        transport: { transports: [] },
        settings: {
            debug: {},
            theme: { variant: 'light' },
            enabledSecurityChecks: {
                deviceAuthenticity: true,
                entropy: true,
                firmwareRevision: true,
                firmwareHash: true,
            },
        },
        online: true,
        locks: [],
        flags: {},
        ...suite,
    },
    device: {
        devices: [],
        ...device,
    },
    bluetooth: {
        unpairedDeviceNeedsManualOsRemoval: false,
    },
    window: {
        size: 'LARGE',
    },
    guide: {},
    messageSystem: {
        config: {
            actions: [],
        },
        validMessages: {
            banner: [],
            context: [],
            modal: [],
            feature: [],
        },
    },
    modal: {
        context: '@modal/context-none',
    },
    notifications: [],
    wallet: {
        discovery: [],
        accountSearch: {},
        settings: {},
        blockchain: {},
    },
    desktopUpdate: desktopUpdateInitialState,
    router: {
        app: 'suite-index',
        loaded: true,
        route: '/dashboard',
        ...router,
    },
    recovery: {},
    analytics: {},
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);

    return store;
};

const Index = ({ app }: any) => <Preloader>{app || 'foo'}</Preloader>;

const deviceCompromisedFixtures = [
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
                    transport: null,
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'WebUsbTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'WebUsbTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
                    transport: { transports: [{ type: 'BridgeTransport' }] },
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
