import { type ConnectWebKey } from './types';

// List of methods that don't work with device, so they don't need to be patched
export const blacklist: ConnectWebKey[] = [
    'init',
    'getSettings',
    'on',
    'off',
    'removeAllListeners',
    'uiResponse',
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
    'dispose',
    'cancel',
    // this API may use device or not, depending on parameters. The flow that doesn't use device is called very often,
    // so locking device must be avoided (blocks a lot of Suite features needlessly)
    // TODO find a better solution to wrap this method only when device is used
    'getAccountInfo',
    // WebUSB methods from Connect web
    'requestWebUSBDevice',
    'disableWebUSB',
    'bleUnpair',
];
