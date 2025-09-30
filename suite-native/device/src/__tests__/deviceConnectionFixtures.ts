import { prepareMessageSystemReducer } from '@suite-common/message-system';
import { extraDependenciesMock, getSuiteDevice } from '@suite-common/test-utils';
import { deviceActions, prepareDeviceReducer } from '@suite-common/wallet-core';
import { deviceOnboardingReducer } from '@suite-native/device-onboarding';
import { featureFlagsReducer } from '@suite-native/feature-flags';
import { nativeFirmwareReducer } from '@suite-native/firmware';
import {
    AuthorizeDeviceStackRoutes,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
} from '@suite-native/navigation';
import { appSettingsReducer } from '@suite-native/settings';
import { DeviceModelInternal } from '@trezor/device-utils';

const DEVICE = getSuiteDevice({ path: '1', connected: true });

const deviceReducer = prepareDeviceReducer(extraDependenciesMock);
const messageSystemReducer = prepareMessageSystemReducer(extraDependenciesMock);

type DevicesState = ReturnType<typeof deviceReducer>;
type AppSettingsState = ReturnType<typeof appSettingsReducer>;
type FeatureFlagsState = ReturnType<typeof featureFlagsReducer>;
type NativeFirmwareState = ReturnType<typeof nativeFirmwareReducer>;
type DeviceOnboardingState = ReturnType<typeof deviceOnboardingReducer>;

type GetInitialState = {
    device?: Partial<DevicesState>;
    appSettings?: Partial<AppSettingsState>;
    featureFlags?: Partial<FeatureFlagsState>;
    nativeFirmware?: Partial<NativeFirmwareState>;
    deviceOnboarding?: Partial<DeviceOnboardingState>;
};

export const getInitialState = ({
    device,
    appSettings,
    featureFlags,
    nativeFirmware,
    deviceOnboarding,
}: GetInitialState) => ({
    device: {
        ...deviceReducer(undefined, { type: 'foo' }),
        ...device,
    },
    appSettings: {
        ...appSettingsReducer(undefined, { type: 'foo' }),
        ...appSettings,
    },
    messageSystem: {
        ...messageSystemReducer(undefined, { type: 'foo' }),
    },
    featureFlags: {
        ...featureFlagsReducer(undefined, { type: 'foo' }),
        ...featureFlags,
    },
    nativeFirmware: {
        ...nativeFirmwareReducer(undefined, { type: 'foo' }),
        ...nativeFirmware,
    },
    deviceOnboarding: {
        ...deviceOnboardingReducer(undefined, { type: 'foo' }),
        ...deviceOnboarding,
    },
});

export const connectDeviceFixtures = [
    {
        description: 'connect device with no coins enabled',
        initialState: getInitialState({}),
        action: { type: deviceActions.connectDevice.type, payload: { device: DEVICE } },
        redirectTarget: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.CoinEnablingInit,
            },
        },
    },
    {
        description: 'connect device with coin enabling finished',
        initialState: getInitialState({
            appSettings: {
                isCoinEnablingInitFinished: true,
            },
        }),
        action: { type: deviceActions.connectDevice.type, payload: { device: DEVICE } },
        redirectTarget: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ConnectingDevice,
            },
        },
    },
    {
        description: 'connect device with failed auth check',
        initialState: getInitialState({
            device: {
                selectedDevice: DEVICE,
                deviceAuthenticity: { [DEVICE.id as string]: { valid: false } },
            },
            appSettings: {
                isDeviceAuthenticityCheckEnabled: true,
            },
        }),
        action: { type: deviceActions.connectDevice.type, payload: { device: DEVICE } },
        redirectTarget: {
            route: RootStackRoutes.DeviceCompromisedModal,
        },
    },
    {
        description: 'uninitialized device connect',
        initialState: getInitialState({}),
        action: {
            type: deviceActions.connectDevice.type,
            payload: {
                device: {
                    ...DEVICE,
                    mode: 'initialize',
                    features: { internal_model: DeviceModelInternal.T3B1 },
                },
            },
        },
        redirectTarget: {
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
                    },
                },
            ],
        },
        isReset: true,
    },
    {
        description: 'uninitialized device connect with cancelled onboarding',
        initialState: getInitialState({
            deviceOnboarding: {
                wasDeviceOnboardingCancelled: true,
            },
        }),
        action: {
            type: deviceActions.connectDevice.type,
            payload: {
                device: {
                    ...DEVICE,
                    mode: 'initialize',
                    features: { internal_model: DeviceModelInternal.T3B1 },
                },
            },
        },
        redirectTarget: {
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
        isReset: true,
    },
    {
        description: 'uninitialized unsupported device connect with cancelled onboarding',
        initialState: getInitialState({}),
        action: {
            type: deviceActions.connectDevice.type,
            payload: {
                device: {
                    ...DEVICE,
                    mode: 'initialize',
                    features: { internal_model: DeviceModelInternal.T1B1 },
                },
            },
        },
        redirectTarget: {
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
        expectNoNavigation: true,
    },
];
