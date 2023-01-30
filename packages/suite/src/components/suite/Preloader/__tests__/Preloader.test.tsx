import React from 'react';

import { configureStore } from '@suite/support/tests/configureStore';
import { renderWithProviders, findByTestId } from '@suite/support/tests/hooksHelper';

import * as envUtils from '@trezor/env-utils';

import Preloader from '..';

// react-svg will not work
jest.mock('react-svg', () => ({ ReactSVG: () => 'SVG' }));
// render only Translation.id in data-test attribute
jest.mock('@suite-components/Translation', () => ({
    Translation: ({ id }: any) => <div data-test={id}>{id}</div>,
}));

// jest.mock('@firmware-components/ReconnectDevicePrompt', () => ({
//     __esModule: true, // export as module
//     default: ({ children }: any) => <div data-test="box">{children}</div>,
// }));
// jest.mock('@onboarding-components/DeviceAnimation', () => ({
//     __esModule: true, // export as module
//     default: ({ children }: any) => <div data-test="box">{children}</div>,
// }));
// do not render animations
// jest.mock('lottie-react', () => ({
//     // Lottie: ({ trezorVersion }: any) => <div>{trezorVersion}</div>,
//     __esModule: true, // export as module
//     default: ({ trezorVersion }: any) => <div data-test="lottie-image">{trezorVersion}</div>,
// }));
// jest.mock('react-use/lib/useMeasure', () => ({
//     // Lottie: ({ trezorVersion }: any) => <div>{trezorVersion}</div>,
//     __esModule: true, // export as module
//     default: () => ['ref', { height: 0 }],
// }));

export const getInitialState = ({ suite, router }: any = {}) => ({
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
    devices: [],
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
        app: 'suite-start',
        loaded: true,
        route: {
            app: 'suite-start',
        },
        ...router,
    },
    recovery: {},
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
        expect(findByTestId('TR_TREZOR_BRIDGE_IS_NOT_RUNNING')).not.toBeNull();

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
        expect(findByTestId('TR_CHECK_FOR_DEVICES')).not.toBeNull();

        unmount();
    });

    it('Unacquired device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { type: 'unacquired' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_ACQUIRE_DEVICE_TITLE')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: webusb HID', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'WebUsbTransport' },
                    device: { type: 'unreadable', error: 'LIBUSB_ERROR_ACCESS' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-hid')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on Linux', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => true);

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { type: 'unreadable', error: 'LIBUSB_ERROR_ACCESS' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-udev')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on non-Linux os (should never happen)', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => false);

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { type: 'unreadable', error: 'LIBUSB_ERROR_ACCESS' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: unknown error', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { type: 'unreadable', error: 'Unexpected error' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unknown device (should never happen)', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { features: null },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_UNKNOWN_DEVICE/)).not.toBeNull();

        unmount();
    });

    it('Seedless device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { mode: 'seedless', features: {} },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_YOUR_DEVICE_IS_SEEDLESS/)).not.toBeNull();
        expect(findByTestId('TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE')).not.toBeNull();

        unmount();
    });

    it('Recovery mode device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { features: { recovery_mode: true } },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_RECOVERY_MODE/)).not.toBeNull();
        expect(findByTestId('TR_CONTINUE')).not.toBeNull();

        unmount();
    });

    it('Not initialized device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { mode: 'initialize', features: {} },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_NOT_INITIALIZED/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('Bootloader device with installed firmware', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { mode: 'bootloader', features: { firmware_present: true } },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_BOOTLOADER/)).not.toBeNull();
        expect(findByTestId('TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT')).not.toBeNull();

        unmount();
    });

    it('Bootloader device without firmware', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { mode: 'bootloader', features: { firmware_present: false } },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_NO_FIRMWARE/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('Required FW update device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'BridgeTransport' },
                    device: { firmware: 'required', features: {} },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/FW_CAPABILITY_UPDATE_REQUIRED/)).not.toBeNull();
        expect(findByTestId('TR_SEE_DETAILS')).not.toBeNull();

        unmount();
    });
});
