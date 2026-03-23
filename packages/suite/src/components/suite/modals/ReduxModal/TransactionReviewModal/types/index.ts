import { type SendState, type StakeState } from '@suite-common/wallet-core';

export const isStakeState = (state: SendState | StakeState): state is StakeState => 'data' in state;
