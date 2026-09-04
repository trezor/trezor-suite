import type { connectCallableMethods } from '@trezor/connect';

// List of methods that don't work with device, so they don't need to be patched
export const blacklist: (typeof connectCallableMethods)[number][] = [
    'getSettings',
    'blockchainGetAccountBalanceHistory',
    'blockchainGetInfo',
    'blockchainGetCurrentFiatRates',
    'blockchainGetFiatRatesForTimestamps',
    'blockchainDisconnect',
    'blockchainEstimateFee',
    'blockchainGetTransactions',
    'blockchainSetCustomBackend',
    'blockchainSubscribe',
    'blockchainSubscribeFiatRates',
    'blockchainUnsubscribe',
    'blockchainUnsubscribeFiatRates',
    'requestLogin',
    'getCoinInfo',
    // Backend-only (PushTransaction sets useDevice: false); locking the device for the whole
    // broadcast queues every other connect method behind it.
    'pushTransaction',
    // this API may use device or not, depending on parameters. The flow that doesn't use device is called very often,
    // so locking device must be avoided (blocks a lot of Suite features needlessly)
    // TODO find a better solution to wrap this method only when device is used
    'getAccountInfo',
    'bleUnpair',
];
