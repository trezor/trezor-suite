import {
    DeviceOnboardingStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
} from '@suite-native/navigation';

// We encourage user to disconnect device when he is redirected to suspicious device screen.
// We should not redirect him away so he can read the screen content and decide what to do.
// If the device is connected again, he still should stay on that screen.
export const DEVICE_DISCONNECTION_BLACKLISTED_ROUTES = [
    DeviceOnboardingStackRoutes.SuspiciousDevice,
];

const SEND_STACK_ROUTES = [...Object.keys(SendStackRoutes), RootStackRoutes.SendStack];

export const DEVICE_CONNECTION_BLACKLISTED_ROUTES = [
    RootStackRoutes.DeviceCompromisedModal,
    DeviceOnboardingStackRoutes.SuspiciousDevice,
    ...SEND_STACK_ROUTES,
];

export const buildDisconnectionBlacklist = (
    isEntropyCheckEnabledAndFailed: boolean,
    isDeviceRemembered: boolean,
) => [
    ...DEVICE_DISCONNECTION_BLACKLISTED_ROUTES,
    // Device compromised modal is persistant and should not be interrupted by device disconnection,
    // however Entropy check modal should be dismissed on disconnect because you cannot exit the modal via normal means
    ...(!isEntropyCheckEnabledAndFailed ? [RootStackRoutes.DeviceCompromisedModal] : []),
    // Add SendStack only if device is remembered
    ...(isDeviceRemembered ? SEND_STACK_ROUTES : []),
];
