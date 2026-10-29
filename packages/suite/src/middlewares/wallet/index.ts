import type { MiddlewareAPI } from 'redux';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { coinjoinMiddleware } from '@suite/coinjoin';
import { prepareDiscoveryMiddleware } from '@suite/discovery';
import { prepareConnectPopupMiddleware } from '@suite-common/connect-popup';
import { type StakingDep, prepareStakingMiddleware } from '@suite-common/earn-staking';
import { prepareSuiteSyncMiddleware } from '@suite-common/suite-sync';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    type TokenDefinitionsMiddlewareDeps,
    prepareTokenDefinitionsMiddleware,
} from '@suite-common/token-definitions';
import {
    prepareAccountsMiddleware,
    prepareBlockchainMiddleware,
    prepareBlockchainSubscriptionMiddleware,
    prepareEarnTransactionsMiddleware,
    prepareFiatRatesMiddleware,
    prepareStakeMiddleware,
} from '@suite-common/wallet-core';
import {
    type WalletConnectMiddlewareDeps,
    prepareWalletConnectMiddleware,
} from '@suite-common/walletconnect';

import { type DbDep } from 'src/storage/createDb';

import graphMiddleware from './graphMiddleware';
import { replaceByFeeErrorMiddleware } from './replaceByFeeErrorMiddleware';
import { prepareStorageMiddleware } from './storageMiddleware';
import { tradingMiddleware } from './tradingMiddleware';
import walletMiddleware from './walletMiddleware';

export type GetWalletMiddlewaresDeps = WalletConnectMiddlewareDeps &
    TokenDefinitionsMiddlewareDeps & {
        services: SuiteSyncDep & DbDep & DesktopAnalyticsDep & StakingDep;
    };

export const getWalletMiddlewares = (
    getExtra: () => GetWalletMiddlewaresDeps | null,
): ((api: MiddlewareAPI) => any)[] => [
    prepareBlockchainMiddleware(getExtra),
    prepareBlockchainSubscriptionMiddleware(getExtra),
    prepareAccountsMiddleware(getExtra),
    prepareEarnTransactionsMiddleware(getExtra),
    walletMiddleware,
    prepareDiscoveryMiddleware(getExtra),
    prepareFiatRatesMiddleware(getExtra),
    prepareTokenDefinitionsMiddleware(getExtra),
    prepareStakeMiddleware(getExtra),
    prepareStakingMiddleware(getExtra),
    prepareStorageMiddleware(getExtra),
    graphMiddleware,
    tradingMiddleware,
    coinjoinMiddleware,
    replaceByFeeErrorMiddleware,
    prepareConnectPopupMiddleware(getExtra),
    prepareWalletConnectMiddleware(getExtra),
    prepareSuiteSyncMiddleware(getExtra),
];
