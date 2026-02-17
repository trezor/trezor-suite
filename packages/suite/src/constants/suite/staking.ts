import { events } from '@suite/analytics';
import { EarnFlow } from '@suite-common/suite-types/src/staking';

export const earnFlowToEventTypeMap = {
    [EarnFlow.Stake]: events.stakingStakeEvent.name,
    [EarnFlow.Yield]: events.stakingYieldEvent.name,
    [EarnFlow.UpdateProvider]: events.stakingUpdateProviderEvent.name,
} as const satisfies Record<EarnFlow, string>;
