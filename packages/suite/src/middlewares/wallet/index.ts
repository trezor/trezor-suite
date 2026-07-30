import type { MiddlewareAPI } from 'redux';

import { coinjoinMiddleware } from '@suite/coinjoin';
import { prepareDiscoveryMiddleware } from '@suite/discovery';
import { prepareConnectPopupMiddleware } from '@suite-common/connect-popup';
import type { ExtraDependencies } from '@suite-common/redux-utils';
import { prepareSuiteSyncMiddleware } from '@suite-common/suite-sync';
import { prepareTokenDefinitionsMiddleware } from '@suite-common/token-definitions';
import {
    prepareAccountsMiddleware,
    prepareBlockchainMiddleware,
    prepareFiatRatesMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';
import { prepareWalletConnectMiddleware } from '@suite-common/walletconnect';

import graphMiddleware from './graphMiddleware';
import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';
import { storageMiddleware } from './storageMiddleware';
import { tradingMiddleware } from './tradingMiddleware';
import walletMiddleware from './walletMiddleware';

export const getWalletMiddlewares = (
    getExtra: () => ExtraDependencies | null,
): ((api: MiddlewareAPI) => any)[] => [
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
