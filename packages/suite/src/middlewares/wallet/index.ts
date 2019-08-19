import discoveryMiddleware from './discoveryMiddleware';
import coingeckoMiddleware from './coingeckoMiddleware';
import persistentStorageMiddleware from './persistentStorageMiddleware';
import walletMiddleware from './walletMiddleware';

export default [
    walletMiddleware,
    discoveryMiddleware,
    coingeckoMiddleware,
    persistentStorageMiddleware,
];
