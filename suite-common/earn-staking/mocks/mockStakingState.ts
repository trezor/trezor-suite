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

type MockStakingStateParams = {
    platform?: StakingPlatform;
    descriptors?: readonly StakingProductDescriptor[];
    positions?: Partial<Record<AccountKey, readonly StakingPosition[]>>;
};

export const mockStakingState = ({
    platform = 'desktop',
    descriptors = [mockStakingProductDescriptor()],
    positions = {},
}: MockStakingStateParams = {}): StakingState =>
    Object.entries(positions).reduce(
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
        stakingReducer(
            stakingInitialState,
            stakingActions.productsRegistered({ platform, descriptors }),
        ),
    );
