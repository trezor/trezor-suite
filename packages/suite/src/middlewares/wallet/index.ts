import type { MiddlewareAPI } from 'redux';

import { coinjoinMiddleware } from '@suite/coinjoin';
import { prepareDiscoveryMiddleware } from '@suite/discovery';
import { prepareConnectPopupMiddleware } from '@suite-common/connect-popup';
import { prepareSuiteSyncMiddleware } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import { prepareTokenDefinitionsMiddleware } from '@suite-common/token-definitions';
import {
    type AccountRefreshThrottleDep,
    prepareAccountsMiddleware,
    prepareBlockchainMiddleware,
    prepareFiatRatesMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';
import {
    type WalletConnectMiddlewareDeps,
    prepareWalletConnectMiddleware,
} from '@suite-common/walletconnect';

import graphMiddleware from './graphMiddleware';
import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';
import { storageMiddleware } from './storageMiddleware';
import { tradingMiddleware } from './tradingMiddleware';
import walletMiddleware from './walletMiddleware';

export type GetWalletMiddlewaresDeps = WalletConnectMiddlewareDeps & {
    services: AccountRefreshThrottleDep & SuiteSyncDep;
};

export const getWalletMiddlewares = (
    getExtra: () => GetWalletMiddlewaresDeps | null,
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
