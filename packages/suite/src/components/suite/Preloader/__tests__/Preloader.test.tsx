import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProviders, findByTestId } from '@suite/support/tests/hooksHelper';
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
// jest.mock('react-spring', () => ({
//     config: {
//         default: {},
//     },
//     animated: {
//         div: (props: any) => <div data-test={props['data-test']}>{props.children}</div>,
//     },
//     useSpring: () => ({}),
// }));

export const getInitialState = ({ suite, router }: any = {}) => ({
    suite: {
        loading: false,
        loaded: true,
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
const mockStore = configureStore<State, any>([thunk]);

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
                    loading: true,
                    loaded: false,
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
                    transport: { type: 'bridge' },
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
                    transport: { type: 'WebUsbPlugin' },
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
                    transport: { type: 'bridge' },
                    device: { type: 'unacquired' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_ACQUIRE_DEVICE_TITLE')).not.toBeNull();

        unmount();
    });

    it('Unreadable device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'bridge' },
                    device: { type: 'unreadable' },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE/)).not.toBeNull();

        unmount();
    });

    it('Unknown device (should never happen)', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'bridge' },
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
                    transport: { type: 'bridge' },
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
                    transport: { type: 'bridge' },
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
                    transport: { type: 'bridge' },
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
                    transport: { type: 'bridge' },
                    device: { mode: 'bootloader', features: { firmware_present: true } },
                },
            }),
        );
        const { unmount } = renderWithProviders(store, <Index app={store.getState().router.app} />);

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_BOOTLOADER/)).not.toBeNull();
        expect(findByTestId('TR_RECONNECT_IN_NORMAL')).not.toBeNull();

        unmount();
    });

    it('Bootloader device without firmware', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { type: 'bridge' },
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
                    transport: { type: 'bridge' },
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
