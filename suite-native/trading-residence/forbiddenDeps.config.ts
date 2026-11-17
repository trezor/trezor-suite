import type { ForbiddenDepsConfig } from '@trezor/requirements';

const allowedConsumers = [
    '@suite-native/trading-.*',
    '@suite-native-app/module-trading',
    // residence screen for iOS post onboarding modal
    '@suite-native-app/app',
    // residence screen in iOS onboarding flow
    '@suite-native-app/module-onboarding',
    // residence settings on iOS
    '@suite-native-app/module-settings',
];

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: `^(?!(${allowedConsumers.join('|')})$)`,
        reason: 'Trading building blocks are used only by the allowed consumers.',
    },
};
