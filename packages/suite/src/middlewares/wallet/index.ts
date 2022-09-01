import discoveryMiddleware from './discoveryMiddleware';
import { prepareFiatRatesMiddleware, blockchainMiddleware } from '@suite-common/wallet-core';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import coinmarketMiddleware from './coinmarketMiddleware';
import coinmarketSavingsMiddleware from './coinmarketSavingsMiddleware';
import pollingMiddleware from './pollingMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { extraDependencies } from '../../support/extraDependencies';

export default [
    blockchainMiddleware(extraDependencies),
    walletMiddleware,
    discoveryMiddleware,
    prepareFiatRatesMiddleware(extraDependencies),
    storageMiddleware,
    graphMiddleware,
    coinmarketMiddleware,
    coinmarketSavingsMiddleware,
    pollingMiddleware,
    coinjoinMiddleware,
];
