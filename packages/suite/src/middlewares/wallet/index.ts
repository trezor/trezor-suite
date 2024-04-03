import {
    prepareFiatRatesMiddleware,
    prepareBlockchainMiddleware,
    prepareTokenDefinitionsMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import coinmarketMiddleware from './coinmarketMiddleware';
import coinmarketSavingsMiddleware from './coinmarketSavingsMiddleware';
import pollingMiddleware from './pollingMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { extraDependencies } from 'src/support/extraDependencies';

export default [
    prepareBlockchainMiddleware(extraDependencies),
    walletMiddleware,
    prepareDiscoveryMiddleware(extraDependencies),
    prepareFiatRatesMiddleware(extraDependencies),
    prepareTokenDefinitionsMiddleware(extraDependencies),
    prepareStakeMiddleware(extraDependencies),
    storageMiddleware,
    graphMiddleware,
    coinmarketMiddleware,
    coinmarketSavingsMiddleware,
    pollingMiddleware,
    coinjoinMiddleware,
];
