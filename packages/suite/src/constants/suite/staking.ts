import { events } from '@suite/analytics';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { type TronFlow } from '@suite-common/wallet-core';

export const earnFlowToEventTypeMap = {
    [EarnFlow.Stake]: events.stakingStakeEvent.name,
    [EarnFlow.UpdateProvider]: events.stakingUpdateProviderEvent.name,
} as const satisfies Record<Exclude<EarnFlow, EarnFlow.Yield>, string>;

export const TRON_FLOW_BY_ROUTE: Partial<Record<string, TronFlow>> = {
    'earn-tron-stake': 'stake',
    'earn-tron-vote': 'vote',
    'earn-tron-unstake': 'unstake',
    'earn-tron-withdraw': 'withdraw',
    'earn-tron-claim': 'claim',
};
