import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { EventType } from '@trezor/suite-analytics';

export const stakingFlowToEventTypeMap = {
    [StakingFlow.Stake]: EventType.StakingStake,
    [StakingFlow.UpdateProvider]: EventType.StakingUpdateProvider,
} as const satisfies Record<StakingFlow, EventType>;
