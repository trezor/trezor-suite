import type { ForbiddenDepsConfig } from '@trezor/requirements';

const forbiddenConsumers = ['@suite-native/trading-.*', '@suite-native-app/module-trading'];

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-in': {
        packageNamePattern: `^(${forbiddenConsumers.join('|')})$`,
        reason: 'Trading packages import trading building blocks directly. This package is the trading interface for the rest of the app.',
    },
};
