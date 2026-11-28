import { useSelector } from 'react-redux';

import {
    selectDeviceEarnStakingPositionsCount,
    useRefreshStakingProductInfo,
} from '@suite-common/earn-staking';
import {
    type EarnListRootState,
    selectHasRunningDiscovery,
    selectYieldPositionsCount,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

import { EarnPositionsEmptyState } from './EarnPositionsEmptyState';
import { StakingPositions } from './staking/StakingPositions';
import { YieldPositions } from './yield/YieldPositions';

export const EarnPositions = () => {
    useRefreshStakingProductInfo();

    const { yieldOpportunities, isLoading, isError } = useYieldOpportunities();

    const stakingPositionsCount = useSelector(selectDeviceEarnStakingPositionsCount);

    const yieldPositionsCount = useSelector((state: EarnListRootState) =>
        selectYieldPositionsCount(state, yieldOpportunities),
    );

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const isEmpty =
        stakingPositionsCount === 0 &&
        yieldPositionsCount === 0 &&
        !isLoading &&
        !isError &&
        !isDiscoveryRunning;

    return (
        <Column alignItems="center">
            <Column width="100%" maxWidth={800} gap={32}>
                {isEmpty ? (
                    <EarnPositionsEmptyState />
                ) : (
                    <>
                        <StakingPositions />
                        <YieldPositions />
                    </>
                )}
            </Column>
        </Column>
    );
};
