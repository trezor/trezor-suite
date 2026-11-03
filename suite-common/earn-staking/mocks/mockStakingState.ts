import {
    type StakingPlatform,
    type StakingPosition,
    type StakingProductDescriptor,
} from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import type { AccountKey } from '@suite-common/wallet-types';

import {
    type StakingState,
    stakingActions,
    stakingInitialState,
    stakingReducer,
} from '../src/state/stakingReducer';
import type { StakingSession } from '../src/state/stakingSessionsReducer';

type MockStakingStateParams = {
    platform?: StakingPlatform;
    descriptors?: readonly StakingProductDescriptor[];
    positions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
    sessions?: readonly StakingSession[];
};

export const mockStakingState = ({
    platform = 'desktop',
    descriptors = [mockStakingProductDescriptor()],
    positions = {},
    sessions = [],
}: MockStakingStateParams = {}): StakingState => {
    const withProducts = stakingReducer(
        stakingInitialState,
        stakingActions.productsRegistered({ platform, descriptors }),
    );
    const withPositions = Object.entries(positions).reduce(
        (state, [accountKey, accountPositions]) =>
            accountPositions === undefined
                ? state
                : stakingReducer(
                      state,
                      stakingActions.positionsSynced({
                          accountKey: accountKey as AccountKey,
                          positions: accountPositions,
                      }),
                  ),
        withProducts,
    );

    return sessions.reduce(
        (state, session) => stakingReducer(state, stakingActions.sessionStarted({ session })),
        withPositions,
    );
};
