import {
    prepareFiatRatesMiddleware,
    prepareBlockchainMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';
import { prepareTokenDefinitionsMiddleware } from '@suite-common/token-definitions';

import { extraDependencies } from 'src/support/extraDependencies';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import { coinmarketMiddleware } from './coinmarketMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';

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
    coinjoinMiddleware,
];
