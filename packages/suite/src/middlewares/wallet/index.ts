import discoveryMiddleware from './discoveryMiddleware';
import coingeckoMiddleware from './coingeckoMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';

export default [walletMiddleware, discoveryMiddleware, coingeckoMiddleware, storageMiddleware];
