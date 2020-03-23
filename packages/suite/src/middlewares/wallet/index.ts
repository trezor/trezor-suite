import discoveryMiddleware from './discoveryMiddleware';
import fiatRatesMiddleware from './fiatRatesMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';

export default [walletMiddleware, discoveryMiddleware, fiatRatesMiddleware, storageMiddleware];
