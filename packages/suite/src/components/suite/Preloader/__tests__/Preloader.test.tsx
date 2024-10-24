import * as envUtils from '@trezor/env-utils';

import { configureStore } from 'src/support/tests/configureStore';
import { renderWithProviders, findByTestId } from 'src/support/tests/hooksHelper';

import { Preloader } from '../Preloader';
import { AppState } from '../../../../reducers/store';
import { DeepPartial } from '@trezor/type-utils';

// render only Translation.id in data-test attribute
jest.mock('src/components/suite/Translation', () => ({
    Translation: ({ id }: any) => <div data-testid={id}>{id}</div>,
}));

// @trezor/connect fetching ethereum definitions

// Preloader/LottieAnimation fetch videos
jest.mock('cross-fetch', () => ({
    __esModule: true,
    default: () => Promise.resolve({ ok: false }),
}));

// jest.mock('@firmware-components/ReconnectDevicePrompt', () => ({
//     __esModule: true, // export as module
//     default: ({ children }: any) => <div data-testid="box">{children}</div>,
// }));
// jest.mock('src/components/onboarding/DeviceAnimation', () => ({
//     __esModule: true, // export as module
//     default: ({ children }: any) => <div data-testid="box">{children}</div>,
// }));
// do not render animations
// jest.mock('lottie-react', () => ({
//     // Lottie: ({ trezorVersion }: any) => <div>{trezorVersion}</div>,
//     __esModule: true, // export as module
//     default: ({ trezorVersion }: any) => <div data-testid="lottie-image">{trezorVersion}</div>,
// }));
// jest.mock('react-use/lib/useMeasure', () => ({
//     // Lottie: ({ trezorVersion }: any) => <div>{trezorVersion}</div>,
//     __esModule: true, // export as module
//     default: () => ['ref', { height: 0 }],
// }));

export const getInitialState = ({ suite, router, device }: any = {}) => ({
    suite: {
        lifecycle: {
            status: 'ready',
        },
        transport: { type: undefined },
        settings: { debug: {}, theme: { variant: 'light' } },
        online: true,
        locks: [],
        flags: {},
        ...suite,
    },
    device: {
        devices: [],
        ...device,
    },
    resize: {
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
    },
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

describe('Preloader component', () => {
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
                    transport: { type: 'BridgeTransport' },
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
                    transport: { type: 'WebUsbTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                type: 'unacquired',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_ACQUIRE_DEVICE_TITLE')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: webusb HID', () => {
        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                type: 'unreadable',
                error: 'LIBUSB_ERROR_ACCESS',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'WebUsbTransport' },
                },
                device,
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-hid')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on Linux', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => true);

        const device: DeepPartial<AppState['device']> = {
            selectedDevice: {
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                type: 'unreadable',
                error: 'LIBUSB_ERROR_ACCESS',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                type: 'unreadable',
                error: 'LIBUSB_ERROR_ACCESS',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                type: 'unreadable',
                error: 'Unexpected error',
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                features: undefined,
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                mode: 'seedless',
                features: {},
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                mode: 'initialize',
                features: {},
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                mode: 'bootloader',
                features: { firmware_present: true },
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                mode: 'bootloader',
                features: { firmware_present: false },
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
                descriptor: { path: '1', session: null, sessionOwner: 'foo', type: 1 },
                firmware: 'required',
                features: {},
            },
        };

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
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
});
