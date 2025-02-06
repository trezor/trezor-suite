/* eslint-disable import/order */
import {
    prepareAccountsMiddleware,
    prepareBlockchainMiddleware,
    prepareFiatRatesMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';
import { prepareTokenDefinitionsMiddleware } from '@suite-common/token-definitions';

import { extraDependencies } from 'src/support/extraDependencies';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import { tradingMiddleware } from './tradingMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';

export default [
    prepareBlockchainMiddleware(extraDependencies),
    prepareAccountsMiddleware(extraDependencies),
    walletMiddleware,
    prepareDiscoveryMiddleware(extraDependencies),
    prepareFiatRatesMiddleware(extraDependencies),
    prepareTokenDefinitionsMiddleware(extraDependencies),
    prepareStakeMiddleware(extraDependencies),
    storageMiddleware,
    graphMiddleware,
    tradingMiddleware,
    coinjoinMiddleware,
    replaceByFeeErrorMiddleware,
];
