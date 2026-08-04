import type { GetNetworkConfigDep } from '@suite-common/networks';
import { type TokenDefinition } from '@suite-common/token-definitions';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getAccountsWithSomeTransactionHistory,
    getStakingProvidersForAnalytics,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getAccountAnalyticsTokenSymbols } from '../tokens/tokenUtils';

export const isAccountActiveForAnalytics = (account: Account) =>
    getAccountsWithSomeTransactionHistory([account]).length > 0 || !account.empty;

export const getAccountInfoAnalyticsPayload = (
    deps: GetNetworkConfigDep,
    account: Account,
    tokenDefinitions: TokenDefinition | undefined,
    hasTraded: boolean,
) => ({
    network: account.symbol,
    accountType: account.accountType,
    index: account.index,
    hasStaked: new BigNumber(getAccountTotalStakingBalance(deps, account) || 0).gt(0),
    hasTraded,
    tokenSymbols: getAccountAnalyticsTokenSymbols(deps, account, tokenDefinitions),
    stakingProviders: getStakingProvidersForAnalytics(deps, [account]),
});
