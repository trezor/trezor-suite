import { type TokenDefinition } from '@suite-common/token-definitions';
import { type Account } from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getAccountsWithSomeTransactionHistory,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getStakingProvidersForAnalytics } from '../staking/shared/stakingUtils';
import { getAccountAnalyticsTokenSymbols } from '../tokens/tokenUtils';

export const isAccountActiveForAnalytics = (account: Account) =>
    getAccountsWithSomeTransactionHistory([account]).length > 0 || !account.empty;

export const getAccountInfoAnalyticsPayload = (
    account: Account,
    tokenDefinitions: TokenDefinition | undefined,
    hasTraded: boolean,
) => ({
    network: account.symbol,
    accountType: account.accountType,
    index: account.index,
    hasStaked: new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0),
    hasTraded,
    tokenSymbols: getAccountAnalyticsTokenSymbols(account, tokenDefinitions),
    stakingProviders: getStakingProvidersForAnalytics([account]),
});
