import type { ForbiddenDepsConfig } from '@trezor/requirements';

const allowedConsumers = [
    '@suite-native/trading-.*',
    '@suite-native-app/module-trading',
    // trading flags - should deprecate?
    '@suite-native/banners',
];

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: `^(?!(${allowedConsumers.join('|')})$)`,
        reason: 'Trading building blocks are used only by the allowed consumers.',
    },
};
