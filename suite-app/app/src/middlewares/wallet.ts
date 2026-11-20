import type { MiddlewareAPI } from 'redux';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { coinjoinMiddleware } from '@suite/coinjoin';
import { prepareDiscoveryMiddleware } from '@suite/discovery';
import { type StakingDep, prepareStakingMiddleware } from '@suite-common/earn-staking';
import { type QueryClientDep } from '@suite-common/react-query';
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
import {
    type DbDep,
    graphMiddleware,
    prepareStorageMiddleware,
    replaceByFeeErrorMiddleware,
    walletTradingMiddleware as tradingMiddleware,
    walletMiddleware,
} from '@trezor/suite';

export type GetWalletMiddlewaresDeps = WalletConnectMiddlewareDeps &
    TokenDefinitionsMiddlewareDeps & {
        services: SuiteSyncDep & DbDep & DesktopAnalyticsDep & StakingDep & QueryClientDep;
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
    prepareWalletConnectMiddleware(getExtra),
    prepareSuiteSyncMiddleware(getExtra),
];
