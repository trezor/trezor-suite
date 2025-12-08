/* eslint-disable import/order */
import {
    prepareAccountsMiddleware,
    prepareBlockchainMiddleware,
    prepareFiatRatesMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';
import { prepareTokenDefinitionsMiddleware } from '@suite-common/token-definitions';
import { prepareConnectPopupMiddleware } from '@suite-common/connect-popup';
import { prepareWalletConnectMiddleware } from '@suite-common/walletconnect';

import { prepareDiscoveryMiddleware } from './discoveryMiddleware';
import storageMiddleware from './storageMiddleware';
import walletMiddleware from './walletMiddleware';
import graphMiddleware from './graphMiddleware';
import { tradingMiddleware } from './tradingMiddleware';
import { coinjoinMiddleware } from './coinjoinMiddleware';
import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';
import type { ExtraDependencies } from '@suite-common/redux-utils';
import { prepareSuiteSyncMiddleware } from '@suite-common/suite-sync';

export const getWalletMiddlewares = (getExtra: () => ExtraDependencies | null) => [
    prepareBlockchainMiddleware(getExtra),
    prepareAccountsMiddleware(getExtra),
    walletMiddleware,
    prepareDiscoveryMiddleware(getExtra),
    prepareFiatRatesMiddleware(getExtra),
    prepareTokenDefinitionsMiddleware(getExtra),
    prepareStakeMiddleware(getExtra),
    storageMiddleware,
    graphMiddleware,
    tradingMiddleware,
    coinjoinMiddleware,
    replaceByFeeErrorMiddleware,
    prepareConnectPopupMiddleware(getExtra),
    prepareWalletConnectMiddleware(getExtra),
    prepareSuiteSyncMiddleware(getExtra),
];
