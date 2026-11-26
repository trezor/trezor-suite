import { events } from '@suite/analytics';
import { type Route } from '@suite/router';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { type TronFlow } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

export const getStakingAccountRouteParams = (account: Account) => ({
    symbol: account.symbol,
    accountIndex: account.index,
    accountType: account.accountType,
});

export const earnFlowToEventTypeMap = {
    [EarnFlow.Stake]: events.stakingStakeEvent.name,
    [EarnFlow.UpdateProvider]: events.stakingUpdateProviderEvent.name,
} as const satisfies Record<Exclude<EarnFlow, EarnFlow.Yield>, string>;

export const TRON_FLOW_BY_ROUTE: Partial<Record<Route['name'], TronFlow>> = {
    'earn-staking-tron-stake': 'stake',
    'earn-staking-tron-vote': 'vote',
    'earn-staking-tron-unstake': 'unstake',
    'earn-staking-tron-withdraw': 'withdraw',
    'earn-staking-tron-claim': 'claim',
};
