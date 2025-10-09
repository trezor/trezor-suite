import { UnknownAction } from '@reduxjs/toolkit';

import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { extraDependenciesMock, getSuiteDevice } from '@suite-common/test-utils';
import { deviceActions, prepareDeviceReducer } from '@suite-common/wallet-core';
import { NativeFirmwareState, nativeFirmwareReducer } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from '@suite-native/navigation';
import { UI } from '@trezor/connect';

const INIT_ACTION = { type: 'foo' };

const deviceReducer = prepareDeviceReducer(extraDependenciesMock);
const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesMock);

type InitialStateConfig = {
    nativeFirmware?: Partial<NativeFirmwareState>;
    device?: Partial<ReturnType<typeof deviceReducer>>;
};

type RootState = {
    nativeFirmware: NativeFirmwareState;
    device: ReturnType<typeof deviceReducer>;
    messageSystem: ReturnType<typeof messageSystemReducer>;
};

type NavigationTarget = {
    route: RootStackRoutes;
    params: {
        screen: string;
        params?: Record<string, any>;
    };
};

type ResetNavigationTarget = {
    index: number;
    routes: Array<{
        name: RootStackRoutes;
        params: {
            screen: string;
        };
    }>;
};

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

const buildInitialState = ({ nativeFirmware, device }: InitialStateConfig = {}): RootState => ({
    nativeFirmware: {
        ...nativeFirmwareReducer(undefined, INIT_ACTION),
        ...nativeFirmware,
    },
    device: {
        ...deviceReducer(undefined, INIT_ACTION),
        ...device,
    },
    messageSystem: messageSystemReducer(undefined, INIT_ACTION),
});

// THP Pairing Fixtures
export const thpPairingBlockedFixtures: NoNavigationFixture[] = [
    {
        description: 'blocks non-THP UI.REQUEST_BUTTON actions',
        initialState: buildInitialState(),
        action: { type: UI.REQUEST_BUTTON },
    },
    {
        description: 'blocks UI.REQUEST_BUTTON with invalid payload name',
        initialState: buildInitialState(),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'non-valid-name' } },
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
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_pairing_request' } },
    },
    {
        description: 'blocks thp_connection_request when firmware installation is running',
        initialState: buildInitialState({
            nativeFirmware: {
                isFirmwareInstallationRunning: true,
            },
        }),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_connection_request' } },
    },
];

export const thpPairingNavigationFixtures: NavigationFixture[] = [
    {
        description: 'navigates to ThpConfirmation on thp_pairing_request',
        initialState: buildInitialState(),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_pairing_request' } },
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
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_connection_request' } },
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
        action: { type: deviceActions.deviceDisconnect.type, payload: getSuiteDevice() },
    },
];

export const deviceDisconnectHomeResetFixtures: ResetNavigationFixture[] = [
    {
        description: 'resets to Home screen on device disconnect',
        initialState: buildInitialState(),
        action: { type: deviceActions.deviceDisconnect.type, payload: getSuiteDevice() },
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
        action: { type: deviceActions.deviceDisconnect.type, payload: getSuiteDevice() },
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
            payload: { ...getSuiteDevice(), descriptor: { apiType: 'bluetooth' } },
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
        action: { type: deviceActions.deviceDisconnect.type, payload: getSuiteDevice() },
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
        action: { type: deviceActions.deviceDisconnect.type, payload: getSuiteDevice() },
    },
];
