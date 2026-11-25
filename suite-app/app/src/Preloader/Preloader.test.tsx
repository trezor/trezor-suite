import '@suite-common/test-utils/globalOverrides';

import { type ReactNode } from 'react';

import { type UnknownAction } from '@reduxjs/toolkit';
import { act, fireEvent, screen, within } from '@testing-library/react';

import { type DesktopAnalyticsDep, events as desktopEvents } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { type DebugState } from '@suite/debug';
import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type DesktopDeviceState } from '@suite/device';
import { type LocksState, lockUI, locksReducer } from '@suite/locks';
import {
    type RouterState,
    type SuiteRouterHistoryDep,
    routerMiddleware,
    routerReducer,
} from '@suite/router';
import { createRouterStateMockForRoute, mockSuiteRouterHistory } from '@suite/router/mocks';
import { events } from '@suite-common/analytics';
import { type AnalyticsState } from '@suite-common/analytics-redux';
import { deviceActions } from '@suite-common/device';
import { type FirmwareRootState, firmwareInitialState } from '@suite-common/firmware';
import { mockNetworkIcon } from '@suite-common/networks/mocks';
import {
    type PersistentDeviceDataState,
    persistentDeviceDataActions,
    persistentDeviceDataInitialState,
    preparePersistentDeviceDataReducer,
} from '@suite-common/persistent-device-data';
import {
    type AcquiredDevice,
    type GetAllowPrereleaseDep,
    type ReportSecurityCheckDep,
    type RerunFwAuthenticityChecksCallDep,
    type ShouldRetryFirmwareRevisionCheckErrorDep,
} from '@suite-common/suite-types';
import {
    defaultDevicePersistentData,
    mockGetAllowPrerelease,
    mockReportSecurityCheck,
    mockRerunFwAuthenticityChecksCall,
    mockShouldRetryFirmwareRevisionCheckError,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TransportInfo } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { isLinux } from '@trezor/env-utils';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';
import {
    type OnboardingState,
    SettingsLayout,
    type SuiteState,
    onboardingReducers,
} from '@trezor/suite';
import {
    type MockSuiteState,
    findByTestId,
    mockInitialAppState,
    renderWithProviders,
} from '@trezor/suite/mocks';
import { type DeepPartial } from '@trezor/type-utils';

import { Preloader } from './Preloader';

const networkIcon = mockNetworkIcon();

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isLinux: jest.fn(() => true),
}));

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

jest.mock('@suite-common/tx-simulation', () => ({}));

const createTransportInfo = (transportInfo: Partial<TransportInfo>): TransportInfo => ({
    type: 'NodeUsbTransport',
    apiType: 'usb',
    version: '',
    ...transportInfo,
});

const defaultDevice = mockSuiteDevice();
if (!isDeviceAcquired(defaultDevice)) {
    throw `${mockSuiteDevice.name}() must return an AcquiredDevice here.`;
}
// Derived from defaultDevice, so that it passes the invariability check
const matchingDevicePersistentData = {
    ...defaultDevicePersistentData,
    device_id: defaultDevice.features.device_id,
    unit_color: defaultDevice.features.unit_color,
    internal_model: defaultDevice.features.internal_model,
};
const compromisedDevice: AcquiredDevice = {
    ...defaultDevice,
    authenticityChecks: {
        firmwareRevision: { success: false, error: 'revision-mismatch' },
        firmwareHash: { success: false, error: 'hash-mismatch' },
    },
};

type GetInitialStateProps = {
    suite?: Partial<SuiteState>;
    router?: Partial<RouterState>;
    // I am not happy about `DeepPartial` here, but it would be hell to fix all the fixtures
    device?: DeepPartial<DesktopDeviceState>;
    analytics?: Partial<AnalyticsState>;
    persistentDeviceData?: PersistentDeviceDataState;
    onboarding?: Partial<OnboardingState>;
    locks?: Partial<LocksState>;
    debug?: Partial<DebugState>;
};

const getInitialState = ({
    suite,
    router,
    device,
    analytics,
    // Manual Device Check already passed by default, so that InteractiveDeviceChecksFlow is not displayed
    persistentDeviceData = { devices: [matchingDevicePersistentData] },
    onboarding,
    locks,
    debug,
}: GetInitialStateProps = {}): MockSuiteState => ({
    ...mockInitialAppState,
    router: { ...mockInitialAppState.router, ...router } as unknown as RouterState,
    device: { ...mockInitialAppState.device, ...device } as DesktopDeviceState,
    analytics: { ...mockInitialAppState.analytics, ...analytics },
    persistentDeviceData,
    onboarding: { ...onboardingReducers(undefined, { type: 'init' }), ...onboarding },
    locks: { ...mockInitialAppState.locks, ...locks },
    debug: { ...mockInitialAppState.debug, ...debug },
    suite: {
        ...mockInitialAppState.suite,
        lifecycle: {
            status: 'ready',
        },
        transport: { transports: [] },
        ...suite,
    },
    wallet: {
        ...mockInitialAppState.wallet,
        selectedAccount: mockInitialAppState.wallet?.selectedAccount ?? { account: null },
        accounts: mockInitialAppState.wallet?.accounts ?? [],
    },
});

type PreloaderTestServices = DesktopAnalyticsDep &
    DesktopApiDep<'getBridgeStatus' | 'getBridgeSettings' | 'on' | 'removeAllListeners'> &
    GetAllowPrereleaseDep &
    ReportSecurityCheckDep &
    RerunFwAuthenticityChecksCallDep &
    ShouldRetryFirmwareRevisionCheckErrorDep &
    SuiteRouterHistoryDep;

type PreloaderTestDeps = WithServices<PreloaderTestServices>;

const createServices = (): PreloaderTestServices => ({
    desktopApi: {
        getBridgeStatus: () =>
            Promise.resolve({ success: true, payload: { service: true, process: true } }),
        getBridgeSettings: () =>
            Promise.resolve({ success: true, payload: { doNotStartOnStartup: false } }),
        on: () => {},
        removeAllListeners: () => {},
    },
    analytics: mockDesktopAnalytics(),
    getAllowPrerelease: mockGetAllowPrerelease(),
    reportSecurityCheck: mockReportSecurityCheck(),
    rerunFwAuthenticityChecksCall: mockRerunFwAuthenticityChecksCall(),
    shouldRetryFirmwareRevisionCheckError: mockShouldRetryFirmwareRevisionCheckError(),
    suiteRouterHistory: mockSuiteRouterHistory(),
});

const Index = ({ app }: any) => <Preloader>{app || 'foo'}</Preloader>;

const notInitializedDevice = mockSuiteDevice(
    { mode: 'initialize', connected: true, available: true, firmware: 'valid' },
    { initialized: false },
);

const persistentDeviceDataReducer = preparePersistentDeviceDataReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadPersistentDeviceData: mockReducer() },
});

// The real device reducer follows Connect device events; these tests only swap the selected device.
const selectedDeviceReducer = (
    state: DesktopDeviceState,
    action: UnknownAction,
): DesktopDeviceState => {
    if (deviceActions.deviceDisconnect.match(action)) {
        return { ...state, selectedDevice: undefined };
    }

    if (deviceActions.updateSelectedDevice.match(action)) {
        return { ...state, selectedDevice: action.payload };
    }

    return state;
};

type RenderPreloaderParams = GetInitialStateProps & {
    children?: ReactNode;
    firmwareStatus?: FirmwareRootState['firmware']['status'];
};

// Renders Preloader over the reducers that onboarding entry, navigation and device checks change.
const renderPreloader = ({
    children = 'foo',
    suite,
    firmwareStatus = firmwareInitialState.status,
    ...stateProps
}: RenderPreloaderParams = {}) => {
    const initialState: MockSuiteState = {
        ...getInitialState({
            ...stateProps,
            suite: {
                transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                ...suite,
            },
        }),
        firmware: { ...firmwareInitialState, status: firmwareStatus },
    };
    const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
        preloadedState: initialState,
        middleware: [routerMiddleware(() => ({}))],
        reducer: (state = initialState, action) => ({
            ...state,
            router: routerReducer(state.router, action),
            locks: locksReducer(state.locks, action),
            onboarding: onboardingReducers(state.onboarding, action),
            persistentDeviceData: persistentDeviceDataReducer(state.persistentDeviceData, action),
            device: selectedDeviceReducer(state.device, action),
        }),
        services: createServices,
    });
    const { unmount } = renderWithProviders(
        { ...services, networks: { networkIcon } },
        <Preloader>{children}</Preloader>,
    );

    return { services, unmount };
};

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

    afterEach(() => {
        jest.useRealTimers();
    });

    it('Loading: suite is loading', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    lifecycle: {
                        status: 'loading',
                    },
                },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('Loading: router is loading', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                router: {
                    loaded: false,
                },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('Loading: transport is not set yet', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: undefined,
                },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('Loading: initially connected device is not in the reducer yet', () => {
        const transport = createTransportInfo({ type: 'BridgeTransport', initialDeviceCount: 1 });
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({ suite: { transport: { transports: [transport] } } }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@suite/loading')).not.toBeNull();

        unmount();
    });

    it('Initially connected device is not awaited for more than 10 seconds', () => {
        jest.useFakeTimers();
        const transport = createTransportInfo({ type: 'BridgeTransport', initialDeviceCount: 1 });
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({ suite: { transport: { transports: [transport] } } }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@suite/loading')).not.toBeNull();

        act(() => jest.advanceTimersByTime(10_000));

        expect(screen.queryByTestId('@suite/loading')).toBeNull();
        expect(findByTestId('@connect-device-prompt')).not.toBeNull();

        unmount();
    });

    it('Remembered device is in the reducer', () => {
        const device = mockSuiteDevice({ firmware: 'required' });
        const transport = createTransportInfo({ type: 'BridgeTransport', initialDeviceCount: 1 });
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: { transport: { transports: [transport] } },
                device: { devices: [device], selectedDevice: device },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(screen.queryByTestId('@suite/loading')).toBeNull();
        expect(findByTestId('@connect-device-prompt')).not.toBeNull();

        unmount();
    });

    it('No transport', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState(),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_NO_TRANSPORT')).not.toBeNull();

        unmount();
    });

    it('Bridge transport, no device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();

        unmount();
    });

    it('WebUSB transport, no device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'WebUsbTransport' })] },
                },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        // expect(findByTestId('web-usb-button')).not.toBeNull();

        unmount();
    });

    it('Unacquired device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('TR_ACQUIRE_DEVICE_TITLE')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: webusb HID', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on Linux', () => {
        (isLinux as jest.Mock).mockImplementation(() => true);

        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('@connect-device-prompt/unreadable-udev')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: missing udev on non-Linux os (should never happen)', () => {
        (isLinux as jest.Mock).mockImplementation(() => false);

        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unreadable device: unknown error', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('@connect-device-prompt/unreadable-unknown')).not.toBeNull();

        unmount();
    });

    it('Unknown device (should never happen)', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId(/TR_UNKNOWN_DEVICE/)).not.toBeNull();

        unmount();
    });

    it('Seedless device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ mode: 'seedless' }) },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('TR_SEEDLESS_SETUP_IS_NOT_SUPPORTED_TITLE')).not.toBeNull();

        unmount();
    });

    it('Recovery mode device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({}, { recovery_status: 'Recovery' }) },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_IN_RECOVERY_MODE/)).not.toBeNull();
        expect(findByTestId('TR_CONTINUE')).not.toBeNull();

        unmount();
    });

    it('Not initialized device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ mode: 'initialize' }) },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/TR_DEVICE_NOT_INITIALIZED/)).not.toBeNull();
        expect(findByTestId('TR_GO_TO_ONBOARDING')).not.toBeNull();

        unmount();
    });

    it('Bootloader device with installed firmware', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
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
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_DEVICE_CONNECTED_BOOTLOADER')).not.toBeNull();
        fireEvent.click(findByTestId('@onboarding/troubleshooting-tips/button'));
        expect(findByTestId('TR_DEVICE_CONNECTED_BOOTLOADER_RECONNECT')).not.toBeNull();

        unmount();
    });

    it.each([false, true])(
        'retries onboarding after navigation unlocks without remounting the sidebar (direct route=%s)',
        isDirectRoute => {
            const { services, unmount } = renderPreloader({
                router: isDirectRoute
                    ? createRouterStateMockForRoute('onboarding-index')
                    : undefined,
                device: {
                    selectedDevice: mockSuiteDevice(
                        { mode: 'initialize', connected: true, available: true },
                        { initialized: false },
                    ),
                },
                persistentDeviceData: persistentDeviceDataInitialState,
                locks: { ui: 1, router: isDirectRoute ? 1 : 0 },
            });
            const sidebar = screen.getByRole('navigation');

            expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
            expect(services.store.getState().router.app === 'onboarding').toBe(isDirectRoute);
            expect(services.store.getState().onboarding.isActive).toBe(false);

            act(() => {
                services.store.dispatch(lockUI(false));
            });

            expect(services.store.getState().router.app).toBe('onboarding');
            expect(services.store.getState().onboarding.isActive).toBe(true);
            expect(screen.getByTestId('@onboarding/stepper')).not.toBeNull();
            expect(screen.getByRole('navigation')).toBe(sidebar);

            unmount();
        },
    );

    it('shows connection prerequisites on a direct onboarding route without a device', () => {
        const { services, unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: { selectedDevice: undefined },
        });

        expect(screen.getByTestId('@connect-device-prompt')).not.toBeNull();
        expect(services.store.getState().onboarding.isActive).toBe(false);
        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();

        unmount();
    });

    it('retries direct onboarding entry after acquisition on the same path', () => {
        const path = 'onboarding-acquisition-device';
        const { services, unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: {
                selectedDevice: mockSuiteDevice({
                    type: 'unacquired',
                    connected: true,
                    transportSessionOwner: undefined,
                    path,
                }),
            },
            persistentDeviceData: { devices: [] },
        });

        expect(services.store.getState().onboarding.isActive).toBe(false);
        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();

        act(() => {
            services.store.dispatch(
                deviceActions.updateSelectedDevice(
                    mockSuiteDevice(
                        {
                            mode: 'initialize',
                            connected: true,
                            available: true,
                            firmware: 'valid',
                            path,
                        },
                        { initialized: false },
                    ),
                ),
            );
        });

        expect(services.store.getState().onboarding.isActive).toBe(true);
        expect(services.store.getState().onboarding.activeStepId).toBe('security-check');
        expect(screen.getByTestId('@onboarding/device-check/setup-button')).not.toBeNull();

        unmount();
    });

    it('detects a device swap before the manual check can be completed and restarts using the new device history', () => {
        const firstDevice = mockSuiteDevice(
            { mode: 'initialize', connected: true, available: true, firmware: 'valid' },
            { initialized: false },
        );
        const secondDevice = mockSuiteDevice(
            {
                id: 'second-device',
                mode: 'initialize',
                connected: true,
                available: true,
                firmware: 'valid',
            },
            { device_id: 'second-device', initialized: false },
        );
        const { services, unmount } = renderPreloader({
            device: { selectedDevice: firstDevice },
            persistentDeviceData: {
                devices: [{ ...matchingDevicePersistentData, device_id: 'second-device' }],
            },
        });

        expect(screen.getByTestId('@onboarding/device-check/setup-button')).not.toBeNull();

        act(() => {
            services.store.dispatch(deviceActions.deviceDisconnect(firstDevice));
            services.store.dispatch(deviceActions.updateSelectedDevice(secondDevice));
        });

        expect(screen.queryByTestId('@onboarding/device-check/setup-button')).toBeNull();
        fireEvent.click(
            screen.getByTestId('@onboarding/unexpected-state/is-same/start-over-button'),
        );
        expect(services.store.getState().onboarding.activeStepId).toBe('firmware');
        expect(services.store.getState().onboarding.prevDeviceId).toBeNull();
        expect(screen.queryByTestId('@onboarding/device-check/setup-button')).toBeNull();

        unmount();
    });

    it('blocks an initialized replacement device even without a disconnect event', () => {
        const firstDevice = mockSuiteDevice(
            {
                id: 'first-device',
                mode: 'initialize',
                connected: true,
                available: true,
                firmware: 'valid',
            },
            { initialized: false },
        );
        const secondDevice = mockSuiteDevice(
            {
                id: 'second-device',
                mode: 'normal',
                connected: true,
                available: true,
                firmware: 'valid',
            },
            { device_id: 'second-device', initialized: true },
        );
        const { services, unmount } = renderPreloader({
            device: { selectedDevice: firstDevice },
            persistentDeviceData: { devices: [] },
        });

        expect(screen.getByTestId('@onboarding/device-check/setup-button')).toBeVisible();

        act(() => {
            services.store.dispatch(deviceActions.updateSelectedDevice(secondDevice));
        });

        expect(screen.queryByTestId('@onboarding/device-check/setup-button')).toBeNull();
        expect(screen.queryByTestId('@onboarding/path-create-button')).toBeNull();
        fireEvent.click(
            screen.getByTestId('@onboarding/unexpected-state/is-same/start-over-button'),
        );
        expect(services.store.getState().router.app).not.toBe('onboarding');
        expect(services.store.getState().onboarding.isActive).toBe(false);
        expect(screen.getByTestId('@onboarding/complete-onboarding')).toBeVisible();

        unmount();
    });

    it('shows the normal sidebar with the device switcher for a disconnected remembered device', () => {
        const { services, unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: { selectedDevice: mockSuiteDevice({ connected: false, available: false }) },
            onboarding: { isActive: true, activeStepId: 'set-pin' },
        });

        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
        expect(screen.getByTestId('@suite/menu/suite-index')).toBeVisible();
        expect(screen.getByTestId('@suite/menu/settings')).toBeVisible();
        expect(screen.getByTestId('@guide/button-open')).toBeVisible();

        fireEvent.click(screen.getByTestId('@menu/switch-device'));

        expect(services.store.getState().router.route?.name).toBe('suite-switch-device');
        expect(services.store.getState().onboarding.activeStepId).toBe('set-pin');

        unmount();
    });

    it('restores the onboarding sidebar at the same step when the device reconnects in bootloader mode', () => {
        const device = mockSuiteDevice(
            { mode: 'initialize', connected: true, available: true, firmware: 'valid' },
            { initialized: false, internal_model: DeviceModelInternal.T1B1, major_version: 1 },
        );
        const { services, unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: { selectedDevice: device },
            persistentDeviceData: {
                devices: [
                    { ...matchingDevicePersistentData, internal_model: DeviceModelInternal.T1B1 },
                ],
            },
            onboarding: { isActive: true, activeStepId: 'firmware' },
        });

        expect(screen.getByTestId('@onboarding/stepper')).not.toBeNull();

        act(() => {
            services.store.dispatch(deviceActions.deviceDisconnect(device));
        });

        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
        expect(screen.getByTestId('@suite/menu/suite-index')).toBeVisible();

        act(() => {
            services.store.dispatch(
                deviceActions.updateSelectedDevice(
                    mockSuiteDevice(
                        { mode: 'bootloader', connected: true, available: true },
                        {
                            internal_model: DeviceModelInternal.T1B1,
                            initialized: false,
                            firmware_present: true,
                            major_version: 1,
                        },
                    ),
                ),
            );
        });

        expect(screen.queryByTestId('@suite/menu/suite-index')).toBeNull();
        expect(screen.getByTestId('@onboarding/stepper')).not.toBeNull();
        expect(services.store.getState().onboarding.activeStepId).toBe('firmware');

        unmount();
    });

    // The device reboots during the installation, so the user must not be offered a way out of it.
    it.each(['started', 'thp-pairing'] as const)(
        'keeps the onboarding sidebar and its progress while the device reboots during a firmware installation (%s)',
        firmwareStatus => {
            const device = mockSuiteDevice(
                { mode: 'initialize', connected: true, available: true, firmware: 'valid' },
                { initialized: false, internal_model: DeviceModelInternal.T1B1, major_version: 1 },
            );
            const { services, unmount } = renderPreloader({
                router: createRouterStateMockForRoute('onboarding-index'),
                device: { selectedDevice: device },
                persistentDeviceData: {
                    devices: [
                        {
                            ...matchingDevicePersistentData,
                            internal_model: DeviceModelInternal.T1B1,
                        },
                    ],
                },
                onboarding: { isActive: true, activeStepId: 'firmware' },
                firmwareStatus,
            });
            const stepper = screen.getByTestId('@onboarding/stepper');

            act(() => {
                services.store.dispatch(deviceActions.deviceDisconnect(device));
            });

            expect(screen.getByTestId('@onboarding/stepper')).toBe(stepper);
            expect(screen.getByTestId('@onboarding/stepper/device')).toHaveAttribute(
                'aria-current',
                'step',
            );
            expect(screen.queryByTestId('@suite/menu/suite-index')).toBeNull();
            expect(screen.getAllByTestId('@guide/button-open')).toHaveLength(1);

            unmount();
        },
    );

    // Debug mode used to add a second Settings button to the onboarding layout.
    it('shows a single Settings item above Help in the onboarding sidebar in debug mode', () => {
        const { unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: { selectedDevice: notInitializedDevice },
            persistentDeviceData: { devices: [] },
            debug: { showDebugMenu: true },
        });
        const bottomNavigation = within(screen.getByTestId('@suite/menu/bottom-navigation'));

        expect(bottomNavigation.getAllByRole('button')).toEqual([
            bottomNavigation.getByTestId('@suite/menu/settings'),
            bottomNavigation.getByTestId('@guide/button-open'),
        ]);
        expect(screen.getAllByTestId('@suite/menu/settings')).toHaveLength(1);

        unmount();
    });

    it('keeps the onboarding sidebar in Settings and returns to the same onboarding step', () => {
        const { services, unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: { selectedDevice: notInitializedDevice },
            persistentDeviceData: { devices: [] },
            children: <SettingsLayout>Settings content</SettingsLayout>,
        });
        const { activeStepId, onboardingAnalytics } = services.store.getState().onboarding;

        const stepViews = () =>
            jest
                .mocked(services.analytics.report)
                .mock.calls.filter(
                    ([event]) => event.type === events.onboardingStepViewedEvent.name,
                );
        expect(stepViews()).toHaveLength(1);

        fireEvent.click(screen.getByTestId('@suite/menu/settings'));

        expect(services.store.getState().router.route?.name).toBe('settings-index');
        expect(screen.queryByTestId('@onboarding-layout/body')).toBeNull();
        expect(screen.getByTestId('@onboarding/stepper')).toBeVisible();
        expect(screen.queryByTestId('@suite/menu/suite-index')).toBeNull();
        expect(screen.getAllByTestId('@guide/button-open')).toHaveLength(1);
        expect(screen.getByTestId('@suite/menu/settings')).toHaveAttribute('aria-current', 'page');

        fireEvent.click(screen.getByTestId('@settings/menu/device'));

        expect(services.store.getState().router.route?.name).toBe('settings-device');
        expect(screen.getByTestId('@onboarding/stepper')).toBeVisible();

        fireEvent.click(screen.getByTestId('@settings/back'));

        expect(services.store.getState().router.route?.name).toBe('onboarding-index');
        expect(services.store.getState().onboarding.activeStepId).toBe(activeStepId);
        expect(services.store.getState().onboarding.onboardingAnalytics.startTime).toBe(
            onboardingAnalytics.startTime,
        );
        expect(screen.getByTestId('@onboarding/device-check/setup-button')).toBeVisible();

        expect(stepViews()).toHaveLength(1);

        unmount();
    });

    it('keeps the normal Settings sidebar when an earlier onboarding is still active', () => {
        const { unmount } = renderPreloader({
            router: createRouterStateMockForRoute('settings-index'),
            device: { selectedDevice: defaultDevice },
            onboarding: { isActive: true },
            children: <SettingsLayout>Settings content</SettingsLayout>,
        });

        expect(screen.getByTestId('@settings/menu/title')).toBeVisible();
        expect(screen.getByTestId('@suite/menu/suite-index')).toBeVisible();
        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
        expect(screen.queryByTestId('@settings/back')).toBeNull();

        unmount();
    });

    it('shows the offline banner during the onboarding manual check', () => {
        const { unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            suite: { online: false },
            device: { selectedDevice: notInitializedDevice },
            persistentDeviceData: { devices: [] },
        });

        expect(screen.getByTestId('@onboarding/device-check/setup-button')).toBeVisible();
        expect(screen.getByTestId('@suite/no-connection-banner')).toBeVisible();

        unmount();
    });

    it('keeps Settings accessible after the device disconnects at the end of onboarding', () => {
        const { services, unmount } = renderPreloader({
            router: createRouterStateMockForRoute('onboarding-index'),
            device: { selectedDevice: undefined },
            onboarding: { isActive: true, activeStepId: 'final' },
            children: <SettingsLayout>Settings content</SettingsLayout>,
        });

        expect(services.store.getState().router.app).toBe('onboarding');
        fireEvent.click(screen.getByTestId('@suite/menu/settings'));

        expect(services.store.getState().router.route?.name).toBe('settings-index');
        expect(screen.queryByTestId('@onboarding-layout/body')).toBeNull();
        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
        expect(screen.getByTestId('@suite/menu/suite-index')).toBeVisible();
        expect(screen.getAllByTestId('@guide/button-open')).toHaveLength(1);
        fireEvent.click(screen.getByTestId('@settings/back'));
        expect(services.store.getState().router.route?.name).toBe('onboarding-index');
        expect(services.store.getState().onboarding.activeStepId).toBe('final');

        unmount();
    });

    // Fresh or factory-reset device always needs Manual Device Check, regardless of persistent device data
    it('keeps Device active and the sidebar mounted when moving from the manual check to firmware', () => {
        const { services, unmount } = renderPreloader({
            device: {
                selectedDevice: mockSuiteDevice(
                    { mode: 'bootloader', connected: true },
                    {
                        firmware_present: false,
                        bootloader_mode: true,
                        initialized: false,
                        internal_model: DeviceModelInternal.T3B1,
                    },
                ),
            },
        });

        expect(findByTestId('@onboarding/device-check/setup-button')).not.toBeNull();
        expect(services.store.getState().router.app).toBe('onboarding');
        expect(services.store.getState().onboarding.activeStepId).toBe('security-check');
        expect(services.store.getState().onboarding.isActive).toBe(true);
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: events.onboardingStepViewedEvent.name,
            payload: { stepName: 'security-check', stepIndex: 1, platform: 'desktop' },
        });
        expect(services.analytics.report).toHaveBeenCalledWith(
            {
                type: desktopEvents.deviceSetupStartedEvent.name,
                payload: { deviceModel: DeviceModelInternal.T3B1 },
            },
            { force: true },
        );
        expect(screen.getByTestId('@onboarding/stepper/device')).toHaveAttribute(
            'aria-current',
            'step',
        );

        const stepper = screen.getByTestId('@onboarding/stepper');
        const navigate = jest.spyOn(services.suiteRouterHistory, 'navigate');

        fireEvent.click(screen.getByTestId('@menu/switch-device'));
        expect(navigate).not.toHaveBeenCalled();

        screen.getAllByRole('checkbox').forEach(checkbox => fireEvent.click(checkbox));
        fireEvent.click(screen.getByTestId('@onboarding/device-check/setup-button'));

        expect(screen.getByTestId('@onboarding/stepper')).toBe(stepper);
        expect(
            jest
                .mocked(services.analytics.report)
                .mock.calls.filter(
                    ([event]) => event.type === desktopEvents.deviceSetupStartedEvent.name,
                ),
        ).toHaveLength(1);
        expect(services.store.getState().onboarding.activeStepId).toBe('firmware');
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: events.onboardingStepViewedEvent.name,
            payload: { stepName: 'firmware', stepIndex: 2, platform: 'desktop' },
        });
        expect(screen.getByTestId('@onboarding/stepper/device')).toHaveAttribute(
            'aria-current',
            'step',
        );

        unmount();
    });

    it('keeps a pending hardware check outside onboarding when manual inspection already passed', () => {
        const device = mockSuiteDevice(
            { mode: 'initialize', connected: true, available: true, firmware: 'valid' },
            { initialized: false, internal_model: DeviceModelInternal.T3B1 },
        );
        const { services, unmount } = renderPreloader({
            device: { selectedDevice: device },
            persistentDeviceData: {
                devices: [
                    {
                        ...matchingDevicePersistentData,
                        internal_model: DeviceModelInternal.T3B1,
                    },
                ],
            },
        });

        expect(screen.getByTestId('TR_LETS_CHECK_YOUR_DEVICE')).not.toBeNull();
        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
        expect(services.store.getState().onboarding.isActive).toBe(false);

        act(() => {
            services.store.dispatch(
                persistentDeviceDataActions.setDeviceAuthenticityResult({
                    deviceId: device.id,
                    result: {
                        valid: true,
                        optigaResult: { valid: true, rootPubKey: 'root-pub-key' },
                        tropicResult: null,
                        mcuResult: null,
                    },
                }),
            );
        });
        fireEvent.click(screen.getByTestId('@authenticity-check/continue-button'));

        expect(screen.getByTestId('@button/go-to-onboarding')).not.toBeNull();
        expect(services.store.getState().onboarding.isActive).toBe(false);

        fireEvent.click(screen.getByTestId('@button/go-to-onboarding'));

        expect(services.store.getState().onboarding.activeStepId).toBe('firmware');
        expect(screen.getByTestId('TR_FIRMWARE_IS_UP_TO_DATE')).not.toBeNull();

        fireEvent.click(screen.getByTestId('@firmware/continue-button'));

        expect(services.store.getState().onboarding.activeStepId).toBe('authenticate-device');
        expect(screen.getByTestId('TR_CONGRATS')).not.toBeNull();
        expect(screen.queryByTestId('@authenticity-check/start-button')).toBeNull();

        unmount();
    });

    it('Initialized device missing in persistent device data', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ connected: true }) },
                persistentDeviceData: persistentDeviceDataInitialState,
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            services,
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@onboarding/complete-onboarding')).not.toBeNull();
        expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();

        unmount();
    });

    it.each([true, false])(
        'opens the appropriate standalone check for a configured Safe device (manual check passed: %s)',
        isManualCheckPassed => {
            const { services, unmount } = renderPreloader({
                device: {
                    selectedDevice: mockSuiteDevice(
                        { connected: true, available: true },
                        { initialized: true, internal_model: DeviceModelInternal.T3B1 },
                    ),
                },
                persistentDeviceData: {
                    devices: isManualCheckPassed
                        ? [
                              {
                                  ...defaultDevicePersistentData,
                                  internal_model: DeviceModelInternal.T3B1,
                              },
                          ]
                        : [],
                },
            });

            if (isManualCheckPassed) {
                expect(screen.getByTestId('TR_LETS_CHECK_YOUR_DEVICE')).not.toBeNull();
                expect(screen.queryByTestId('@onboarding/complete-onboarding')).toBeNull();
            } else {
                expect(screen.getByTestId('TR_USED_TREZOR_BEFORE')).not.toBeNull();
                expect(screen.getByTestId('@onboarding/complete-onboarding')).not.toBeNull();
            }
            expect(screen.queryByTestId('@onboarding/stepper')).toBeNull();
            expect(services.store.getState().onboarding.isActive).toBe(false);

            unmount();
        },
    );

    it('Not initialized device missing in persistent device data', () => {
        const { unmount } = renderPreloader({
            device: {
                selectedDevice: mockSuiteDevice(
                    { mode: 'initialize', connected: true },
                    { initialized: false },
                ),
            },
            persistentDeviceData: persistentDeviceDataInitialState,
        });

        expect(findByTestId('@onboarding/device-check/setup-button')).not.toBeNull();

        unmount();
    });

    it('displays DeviceCompromised when shouldDisplayDeviceCompromised is true', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                device: { selectedDevice: compromisedDevice },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );
        expect(findByTestId('@device-compromised')).not.toBeNull();

        unmount();
    });

    it('Required FW update device', () => {
        const { services } = createTestCompositionRoot<PreloaderTestDeps, MockSuiteState>({
            preloadedState: getInitialState({
                suite: {
                    transport: { transports: [createTransportInfo({ type: 'BridgeTransport' })] },
                },
                device: { selectedDevice: mockSuiteDevice({ firmware: 'required' }) },
            }),
            services: createServices,
        });
        const { unmount } = renderWithProviders(
            { ...services, networks: { networkIcon } },
            <Index app={services.store.getState().router.app} />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId(/FW_CAPABILITY_UPDATE_REQUIRED/)).not.toBeNull();
        expect(findByTestId('TR_JUST_INSTALL')).not.toBeNull();

        unmount();
    });
});
