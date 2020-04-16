import blockchainMiddleware from './blockchainMiddleware';
import discoveryMiddleware from './discoveryMiddleware';
import fiatRatesMiddleware from './fiatRatesMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';

export default [
    blockchainMiddleware,
    walletMiddleware,
    discoveryMiddleware,
    fiatRatesMiddleware,
    storageMiddleware,
    graphMiddleware,
];
