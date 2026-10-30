import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';

import { type StakingApiState, stakingApi, stakingApiReducer } from '../src/state/stakingApi';

type MockStakingApiStateParams = {
    productInfo?: Partial<Record<StakingProductId, StakingProductInfo>>;
};

export const mockStakingApiState = ({
    productInfo = {},
}: MockStakingApiStateParams = {}): StakingApiState =>
    stakingApiReducer(
        undefined,
        stakingApi.util.upsertQueryEntries(
            Object.entries(productInfo).flatMap(([productId, info]) =>
                info === undefined
                    ? []
                    : [
                          {
                              endpointName: 'getProductInfo' as const,
                              arg: productId as StakingProductId,
                              value: info,
                          },
                      ],
            ),
        ),
    );
