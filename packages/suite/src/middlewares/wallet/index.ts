import blockchainMiddleware from './blockchainMiddleware';
import discoveryMiddleware from './discoveryMiddleware';
import fiatRatesMiddleware from './fiatRatesMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import coinmarketMiddleware from './coinmarketMiddleware';
import invityAuthenticationMiddleware from './invityAuthenticationMiddleware';
import coinmarketSavingsMiddleware from './coinmarketSavingsMiddleware';

export default [
    blockchainMiddleware,
    walletMiddleware,
    discoveryMiddleware,
    fiatRatesMiddleware,
    storageMiddleware,
    graphMiddleware,
    coinmarketMiddleware,
    invityAuthenticationMiddleware,
    coinmarketSavingsMiddleware,
];
