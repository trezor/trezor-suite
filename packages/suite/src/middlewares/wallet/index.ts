import blockchainMiddleware from './blockchainMiddleware';
import discoveryMiddleware from './discoveryMiddleware';
import { fiatRatesMiddleware } from '@suite-common/wallet-core';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import coinmarketMiddleware from './coinmarketMiddleware';
import coinmarketSavingsMiddleware from './coinmarketSavingsMiddleware';
import pollingMiddleware from './pollingMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';

export default [
    blockchainMiddleware,
    walletMiddleware,
    discoveryMiddleware,
    fiatRatesMiddleware,
    storageMiddleware,
    graphMiddleware,
    coinmarketMiddleware,
    coinmarketSavingsMiddleware,
    pollingMiddleware,
    coinjoinMiddleware,
];
