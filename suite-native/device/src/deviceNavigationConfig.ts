import {
    DeviceOnboardingStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
} from '@suite-native/navigation';

// We encourage user to disconnect device when he is redirected to suspicious device screen.
// We should not redirect him away so he can read the screen content and decide what to do.
// If the device is connected again, he still should stay on that screen.
export const DEVICE_DISCONNECTION_BLACKLISTED_ROUTES = [
    RootStackRoutes.DeviceCompromisedModal,
    DeviceOnboardingStackRoutes.SuspiciousDevice,
];

const SEND_STACK_ROUTES = [...Object.keys(SendStackRoutes), RootStackRoutes.SendStack];

export const DEVICE_CONNECTION_BLACKLISTED_ROUTES = [
    RootStackRoutes.DeviceCompromisedModal,
    DeviceOnboardingStackRoutes.SuspiciousDevice,
    ...SEND_STACK_ROUTES,
];

export const buildDisconnectionBlacklist = (isDeviceRemembered: boolean) => [
    ...DEVICE_DISCONNECTION_BLACKLISTED_ROUTES,
    // Add SendStack only if device is remembered
    ...(isDeviceRemembered ? SEND_STACK_ROUTES : []),
];
