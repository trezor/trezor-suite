import type { ForbiddenDepsConfig } from '@trezor/requirements';

const allowedConsumers = [
    '@suite-native/trading-.*',
    '@suite-native-app/module-trading',
    // trading availability in tab navigator
    '@suite-native-app/app',
    // trading environment select in dev utils
    '@suite-native-app/module-dev-utils',
    // buy button on empty portfolio - should deprecate?
    '@suite-native-app/module-home',
    '@suite-native-app/module-onboarding',
    '@suite-native-app/module-settings',
    '@suite-native-app/state',
    // trading promo banner - should deprecate?
    '@suite-native/banners',
    // trading flags - should deprecate?
    '@suite-native/module-earn',
];

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: `^(?!(${allowedConsumers.join('|')})$)`,
        reason: 'Trading building blocks are used only by the allowed consumers.',
    },
};
