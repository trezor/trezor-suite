import { EventType } from '@suite/analytics';
import { EarnFlow } from '@suite-common/suite-types/src/staking';

export const earnFlowToEventTypeMap = {
    [EarnFlow.Stake]: EventType.StakingStake,
    [EarnFlow.Yield]: EventType.StakingYield,
    [EarnFlow.UpdateProvider]: EventType.StakingUpdateProvider,
} as const satisfies Record<EarnFlow, EventType>;
