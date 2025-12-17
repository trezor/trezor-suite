import { EventType } from '@suite/analytics';
import { StakingFlow } from '@suite-common/suite-types/src/staking';

export const stakingFlowToEventTypeMap = {
    [StakingFlow.Stake]: EventType.StakingStake,
    [StakingFlow.UpdateProvider]: EventType.StakingUpdateProvider,
} as const satisfies Record<StakingFlow, EventType>;
