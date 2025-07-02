import { ConnectWebKey } from './types';

/**
 * does not need wrapping blacklist
 */
export const blacklist: ConnectWebKey[] = [
    // List of utility methods that don't need to be patched - getting info for them is not valuable
    'manifest',
    'init',
    'setTransports',
    'getSettings',
    'on',
    'off',
    'removeAllListeners',
    'uiResponse',
    //  at the moment, we don't need to get info for blockchain methods, but we could add them later
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
    // more utility methods
    'requestLogin',
    'getCoinInfo',
    'dispose',
    'cancel',
    // WebUSB methods from Connect web
    'requestWebUSBDevice',
    'disableWebUSB',
    'bleUnpair',
];
