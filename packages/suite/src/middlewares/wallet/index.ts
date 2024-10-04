import {
    prepareFiatRatesMiddleware,
    prepareBlockchainMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import { coinmarketMiddleware } from './coinmarketMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { extraDependencies } from 'src/support/extraDependencies';
import { prepareTokenDefinitionsMiddleware } from '@suite-common/token-definitions';

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
