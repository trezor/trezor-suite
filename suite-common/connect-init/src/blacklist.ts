import { ConnectKey } from './types';

// List of methods that don't work with device, so they don't need to be patched
export const blacklist: ConnectKey[] = [
    'manifest',
    'init',
    'setTransports',
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
];
