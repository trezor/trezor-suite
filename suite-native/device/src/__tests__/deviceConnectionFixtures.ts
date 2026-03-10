import { UnknownAction } from '@reduxjs/toolkit';

import { deviceActions, prepareDeviceReducer } from '@suite-common/device';
import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { prepareThpReducer } from '@suite-common/thp';
import { prepareWalletSettingsReducer } from '@suite-common/wallet-core';
import { deviceOnboardingSlice } from '@suite-native/device-onboarding';
import { featureFlagsSlice } from '@suite-native/feature-flags';
import { NativeFirmwareState, nativeFirmwareReducer } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from '@suite-native/navigation';
import type { RootStackParamList } from '@suite-native/navigation';
import { appSettingsSlice } from '@suite-native/settings';
import { FirmwareType, UI_REQUEST } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

const INIT_ACTION = { type: 'foo' };

const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesCommonMock);
const walletSettingsReducer = prepareWalletSettingsReducer(extraDependenciesCommonMock);
const thpReducer = prepareThpReducer(extraDependenciesCommonMock);

type InitialStateConfig = {
    nativeFirmware?: Partial<NativeFirmwareState>;
    device?: Partial<ReturnType<typeof deviceReducer>>;
    deviceOnboarding?: Partial<typeof deviceOnboardingSlice.reducer>;
    walletSettings?: Partial<ReturnType<typeof walletSettingsReducer>>;
    appSettings?: Partial<typeof appSettingsSlice.reducer>;
    featureFlags?: Partial<typeof featureFlagsSlice.reducer>;
    thp?: Partial<ReturnType<typeof thpReducer>>;
};

type RootState = {
    nativeFirmware: NativeFirmwareState;
    device: ReturnType<typeof deviceReducer>;
    deviceOnboarding?: Partial<typeof deviceOnboardingSlice.reducer>;
    wallet: {
        settings: ReturnType<typeof walletSettingsReducer>;
    };
    messageSystem: ReturnType<typeof messageSystemReducer>;
    appSettings: ReturnType<typeof appSettingsSlice.reducer>;
    featureFlags: ReturnType<typeof featureFlagsSlice.reducer>;
    thp: ReturnType<typeof thpReducer>;
};

// All routes typed directly from RootStackParamList
type RouteEntry = {
    [K in keyof RootStackParamList]: {
        name: K;
        params: RootStackParamList[K];
    };
}[keyof RootStackParamList];

type ResetNavigationRoute =
    | RouteEntry
    | {
          name: RootStackRoutes.AppTabs;
          params: { screen: HomeStackRoutes };
      };

type ResetNavigationTarget = {
    index: number;
    routes: ResetNavigationRoute[];
};

type NavigationTarget = {
    [K in keyof RootStackParamList]: undefined extends RootStackParamList[K]
        ? { route: K; params?: RootStackParamList[K] }
        : { route: K; params: RootStackParamList[K] };
}[keyof RootStackParamList];

type NavigationFixture = {
    description: string;
    initialState: RootState;
    action: UnknownAction;
    expectedNavigation: NavigationTarget;
};

type ResetNavigationFixture = {
    description: string;
    initialState: RootState;
    action: UnknownAction;
    expectedReset: ResetNavigationTarget;
};

type NoNavigationFixture = {
    description: string;
    initialState: RootState;
    action: UnknownAction;
};

const buildInitialState = ({
    nativeFirmware,
    device,
    walletSettings,
    deviceOnboarding,
    appSettings,
    featureFlags,
    thp,
}: InitialStateConfig = {}): RootState => ({
    nativeFirmware: {
        ...nativeFirmwareReducer(undefined, INIT_ACTION),
        ...nativeFirmware,
    },
    device: {
        ...deviceReducer(undefined, INIT_ACTION),
        ...device,
    },
    deviceOnboarding: {
        ...deviceOnboardingSlice.reducer(undefined, INIT_ACTION),
        ...deviceOnboarding,
    },
    wallet: {
        settings: {
            ...walletSettingsReducer(undefined, INIT_ACTION),
            ...walletSettings,
        },
    },
    appSettings: {
        ...appSettingsSlice.reducer(undefined, INIT_ACTION),
        ...appSettings,
    },
    messageSystem: { ...messageSystemReducer(undefined, INIT_ACTION) },
    featureFlags: {
        ...featureFlagsSlice.reducer(undefined, INIT_ACTION),
        ...featureFlags,
    },
    thp: {
        ...thpReducer(undefined, INIT_ACTION),
        ...thp,
    },
});

// THP Pairing Fixtures
export const thpPairingBlockedFixtures: NoNavigationFixture[] = [
    {
        description: 'blocks non-THP UI_REQUEST.REQUEST_BUTTON actions',
        initialState: buildInitialState(),
        action: { type: UI_REQUEST.REQUEST_BUTTON },
    },
    {
        description: 'blocks UI_REQUEST.REQUEST_BUTTON with invalid payload name',
        initialState: buildInitialState(),
        action: { type: UI_REQUEST.REQUEST_BUTTON, payload: { name: 'non-valid-name' } },
    },
    {
        description: 'blocks unrelated action types',
        initialState: buildInitialState(),
        action: { type: 'RANDOM_ACTION' },
    },
    {
        description: 'blocks thp_pairing_request when firmware installation is running',
        initialState: buildInitialState({
            nativeFirmware: {
                isFirmwareInstallationRunning: true,
            },
        }),
        action: { type: UI_REQUEST.REQUEST_BUTTON, payload: { name: 'thp_pairing_request' } },
    },
    {
        description: 'blocks thp_connection_request when firmware installation is running',
        initialState: buildInitialState({
            nativeFirmware: {
                isFirmwareInstallationRunning: true,
            },
        }),
        action: { type: UI_REQUEST.REQUEST_BUTTON, payload: { name: 'thp_connection_request' } },
    },
];

export const thpPairingNavigationFixtures: NavigationFixture[] = [
    {
        description: 'navigates to ThpConfirmation on thp_pairing_request',
        initialState: buildInitialState(),
        action: { type: UI_REQUEST.REQUEST_BUTTON, payload: { name: 'thp_pairing_request' } },
        expectedNavigation: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
            },
        },
    },
    {
        description: 'navigates to ThpConfirmation on thp_connection_request',
        initialState: buildInitialState(),
        action: { type: UI_REQUEST.REQUEST_BUTTON, payload: { name: 'thp_connection_request' } },
        expectedNavigation: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
            },
        },
    },
] as const;

// Device Disconnect Fixtures
export const deviceDisconnectBlockedFixtures: NoNavigationFixture[] = [
    {
        description: 'blocks navigation when firmware installation is running',
        initialState: buildInitialState({
            nativeFirmware: {
                isFirmwareInstallationRunning: true,
            },
        }),
        action: { type: deviceActions.deviceDisconnect.type, payload: mockSuiteDevice() },
    },
];

export const deviceDisconnectHomeResetFixtures: ResetNavigationFixture[] = [
    {
        description: 'resets to Home screen on device disconnect',
        initialState: buildInitialState(),
        action: { type: deviceActions.deviceDisconnect.type, payload: mockSuiteDevice() },
        expectedReset: {
            index: 0,
            routes: [
                {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                },
            ],
        },
    },
];

export const deviceDisconnectDuringOnboardingFixtures: NavigationFixture[] = [
    {
        description: 'navigates to DeviceDisconnected screen (USB connection)',
        initialState: buildInitialState(),
        action: { type: deviceActions.deviceDisconnect.type, payload: mockSuiteDevice() },
        expectedNavigation: {
            route: RootStackRoutes.DeviceOnboardingStack,
            params: {
                screen: DeviceOnboardingStackRoutes.DeviceDisconnected,
                params: { wasDeviceConnectedViaBluetooth: false },
            },
        },
    },
    {
        description: 'navigates to DeviceDisconnected screen (Bluetooth connection)',
        initialState: buildInitialState(),
        action: {
            type: deviceActions.deviceDisconnect.type,
            payload: { ...mockSuiteDevice(), descriptor: { apiType: 'bluetooth' } },
        },
        expectedNavigation: {
            route: RootStackRoutes.DeviceOnboardingStack,
            params: {
                screen: DeviceOnboardingStackRoutes.DeviceDisconnected,
                params: { wasDeviceConnectedViaBluetooth: true },
            },
        },
    },
];

export const deviceDisconnectNotOnHomeFixtures: ResetNavigationFixture[] = [
    {
        description: 'resets to Home screen when not already on Home',
        initialState: buildInitialState(),
        action: { type: deviceActions.deviceDisconnect.type, payload: mockSuiteDevice() },
        expectedReset: {
            index: 0,
            routes: [
                {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                },
            ],
        },
    },
];

export const deviceDisconnectOnHomeFixtures: NoNavigationFixture[] = [
    {
        description: 'does not navigate when already on Home screen',
        initialState: buildInitialState(),
        action: { type: deviceActions.deviceDisconnect.type, payload: mockSuiteDevice() },
    },
];

export const deviceConnectBlockedFixtures: NoNavigationFixture[] = [
    {
        description: 'blocks navigation when on a blacklisted route',
        initialState: buildInitialState(),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice() },
        },
    },
    {
        description: 'blocks navigation when firmware installation is running',
        initialState: buildInitialState({
            nativeFirmware: { isFirmwareInstallationRunning: true },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice() },
        },
    },
    {
        description: 'blocks navigation when auto-connect offered',
        initialState: buildInitialState({
            thp: { autoconnectStep: 'AutoconnectInfo' },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice() },
        },
    },
    {
        description: 'blocks navigation when device is remembered and a network is enabled',
        initialState: buildInitialState({
            device: {
                devices: [mockSuiteDevice()],
            },
            walletSettings: {
                enabledNetworks: ['btc'],
            },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice() },
        },
    },
    {
        description: 'blocks onboarding navigation when device setup is not supported',
        initialState: buildInitialState({}),
        action: {
            type: deviceActions.connectDevice.type,
            payload: {
                device: {
                    ...mockSuiteDevice(
                        { mode: 'initialize' },
                        { initialized: false, internal_model: DeviceModelInternal.T1B1 },
                    ),
                },
            },
        },
    },
];

export const deviceConnectCompromisedFixtures: NavigationFixture[] = [
    {
        description: 'navigates to DeviceCompromisedModal when device is compromised',
        initialState: buildInitialState({
            appSettings: {
                isDeviceAuthenticityCheckEnabled: true,
            },
            walletSettings: {
                enabledNetworks: ['btc'],
            },
            device: {
                selectedDevice: mockSuiteDevice(),
                deviceAuthenticity: {
                    [mockSuiteDevice().id ?? '']: { valid: false, error: 'foo' },
                },
            },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: {
                device: mockSuiteDevice(),
            },
        },
        expectedNavigation: {
            route: RootStackRoutes.DeviceCompromisedModal,
            params: {
                failedCheck: 'device-authenticity',
            },
        },
    },
];

export const deviceConnectUninitializedFixtures: ResetNavigationFixture[] = [
    {
        description: 'resets to Home then UninitializedDeviceLanding for new uninitialized device',
        initialState: buildInitialState({}),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice(undefined, { initialized: false }) },
        },
        expectedReset: {
            index: 1,
            routes: [
                {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                },
                {
                    name: RootStackRoutes.DeviceOnboardingStack,
                    params: {
                        screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
                        params: {
                            deviceModel: DeviceModelInternal.T2T1,
                        },
                    },
                },
            ],
        },
    },
    {
        description: 'resets only to Home for uninitialized device when onboarding was cancelled',
        initialState: buildInitialState({
            deviceOnboarding: {
                wasDeviceOnboardingCancelled: true,
            },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice(undefined, { initialized: false }) },
        },
        expectedReset: {
            index: 0,
            routes: [
                {
                    name: RootStackRoutes.AppTabs,
                    params: {
                        screen: HomeStackRoutes.Home,
                    },
                },
            ],
        },
    },
];

export const deviceConnectAuthorizedFixtures: NavigationFixture[] = [
    {
        description:
            'navigates to ConnectingDevice when connected new device and network is enabled',
        initialState: buildInitialState({
            walletSettings: {
                enabledNetworks: ['btc'],
            },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice() },
        },
        expectedNavigation: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
            },
        },
    },
    {
        description: 'navigates to CoinEnablingInit when connected new and network is NOT enabled',
        initialState: buildInitialState({}),
        action: {
            type: deviceActions.connectDevice.type,
            payload: { device: mockSuiteDevice() },
        },
        expectedNavigation: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
            },
        },
    },
    {
        description: 'Skips coin enabling for bitcoin only FW and goes to connecting screen',
        initialState: buildInitialState({
            device: {
                selectedDevice: mockSuiteDevice(),
            },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: {
                device: {
                    ...mockSuiteDevice(),
                    firmwareType: FirmwareType.BitcoinOnly,
                },
            },
        },
        expectedNavigation: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
            },
        },
    },
];
