import '@suite-common/test-utils/src/globalOverrides';

import { fireEvent } from '@testing-library/react';

import { type RouterState } from '@suite/router';
import { type AnalyticsState } from '@suite-common/analytics-redux';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TransportInfo } from '@trezor/connect';
import * as envUtils from '@trezor/env-utils';
import { type DeepPartial } from '@trezor/type-utils';

import { type DesktopDeviceState } from 'src/actions/device/deviceSlice';
import { type AppState } from 'src/reducers/store';
import { type SuiteState } from 'src/reducers/suite/suiteReducer';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { configureStore } from 'src/support/tests/configureStore';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { findByTestId, renderWithProviders } from 'src/support/tests/hooksHelper';

import { Preloader } from '../Preloader';
import * as selectShouldDisplayDeviceCompromisedModule from '../selectShouldDisplayDeviceCompromisedOnRoute';

class ResizeObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
}

window.ResizeObserver = ResizeObserverMock;

// !!! Must be a stable reference, else it will break some hooks / memoization and causes inf. re-renders
const translationStringMock = (id: string) => id;

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: any) => <span data-testid={id}>{id}</span>,
    useTranslation: () => ({ translationString: translationStringMock }),
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

jest.mock('@suite-common/tx-simulation', () => ({}));

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
    device?: DeepPartial<DesktopDeviceState>;
    analytics?: Partial<AnalyticsState>;
};

const getInitialState = ({
    suite,
    router,
    device,
    analytics,
}: GetInitialStateProps = {}): AppState => ({
    ...initialAppState,
    router: { ...initialAppState.router, ...router } as unknown as RouterState,
    device: { ...initialAppState.device, ...device } as DesktopDeviceState,
    analytics: { ...initialAppState.analytics, ...analytics },
    suite: {
        ...initialAppState.suite,
        lifecycle: {
            status: 'ready',
        },
        transport: { transports: [] },
        ...suite,
    },
    wallet: {
        ...initialAppState.wallet,
        selectedAccount: initialAppState.wallet?.selectedAccount ?? { account: null },
        accounts: initialAppState.wallet?.accounts ?? [],
    },
});

const mockStore = configureStore<AppState, any>();

const initStore = (state: AppState) => mockStore(state);

const Index = ({ app }: any) => <Preloader>{app || 'foo'}</Preloader>;

describe(`${Preloader.name} component`, () => {
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
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );
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
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );
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
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('No transport', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );
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
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();

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
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        // expect(findByTestId('web-usb-button')).not.toBeNull();

        unmount();
    });

    it('Unacquired device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice({
                        transportSessionOwner: 'foo',
                        type: 'unacquired',
                    }),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('TR_ACQUIRE_DEVICE_TITLE')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: webusb HID', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'WebUsbTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice({
                        type: 'unreadable',
                        error: 'unable to open device',
                        hid: true,
                    }),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on Linux', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => true);

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice({
                        type: 'unreadable',
                        error: 'LIBUSB_ERROR_ACCESS',
                    }),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('@connect-device-prompt/unreadable-udev')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on non-Linux os (should never happen)', () => {
        jest.spyOn(envUtils, 'isLinux').mockImplementation(() => false);

        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice({
                        type: 'unreadable',
                        error: 'LIBUSB_ERROR_ACCESS',
                    }),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: unknown error', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice({
                        type: 'unreadable',
                        error: 'Unexpected error',
                    }),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unknown device (should never happen)', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice({
                        transportSessionOwner: 'foo',
                        features: undefined,
                    }),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId(/TR_UNKNOWN_DEVICE/)).not.toBeNull();

        unmount();
    });

    it('Seedless device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ mode: 'seedless' }) },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE')).not.toBeNull();

        unmount();
    });

    it('Recovery mode device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({}, { recovery_status: 'Recovery' }) },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_RECOVERY_MODE/)).not.toBeNull();
        expect(findByTestId('TR_CONTINUE')).not.toBeNull();

        unmount();
    });

    it('Not initialized device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ mode: 'initialize' }) },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_NOT_INITIALIZED/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('Bootloader device with installed firmware', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice(
                        { mode: 'bootloader' },
                        { firmware_present: true, bootloader_mode: true },
                    ),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_DEVICE_CONNECTED_BOOTLOADER')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT')).not.toBeNull();

        unmount();
    });

    it('Bootloader device without firmware', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: {
                    selectedDevice: mockSuiteDevice(
                        { mode: 'bootloader' },
                        { firmware_present: false, bootloader_mode: true },
                    ),
                },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_NO_FIRMWARE/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('displays DeviceCompromised when shouldDisplayDeviceCompromised is true', () => {
        const spy = jest
            .spyOn(
                selectShouldDisplayDeviceCompromisedModule,
                'selectShouldDisplayDeviceCompromisedOnRoute',
            )
            .mockImplementation(() => true);

        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );
        expect(findByTestId('@device-compromised')).not.toBeNull();

        unmount();
        spy.mockRestore();
    });

    it('Required FW update device', () => {
        const store = initStore(
            getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ firmware: 'required' }) },
            }),
        );
        const { unmount } = renderWithProviders(
            store,
            extraDependenciesDesktopMock.services,
            <Index app={store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/FW_CAPABILITY_UPDATE_REQUIRED/)).not.toBeNull();
        expect(findByTestId('TR_JUST_INSTALL')).not.toBeNull();

        unmount();
    });
});
