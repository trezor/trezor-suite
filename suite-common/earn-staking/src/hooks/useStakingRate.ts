import { useSelector } from 'react-redux';

import {
    type StakingProductId,
    type StakingRateKind,
    getStakingPositionRate,
} from '@suite-common/earn-staking-common';
import type { AccountKey } from '@suite-common/wallet-types';

import { useStakingProductInfo } from './useStakingProductInfo';
import type { StakingRootState } from '../state/stakingReducer';
import { selectStakingPosition, selectStakingProductDescriptor } from '../state/stakingSelectors';

export type UseStakingRateParams = {
    productId: StakingProductId;
    accountKey?: AccountKey;
};

export type StakingRateResult = {
    rate: number | null;
    rateKind: StakingRateKind | null;
    isPending: boolean;
};

export const useStakingRate = ({
    productId,
    accountKey,
}: UseStakingRateParams): StakingRateResult => {
    const { productInfo, isPending } = useStakingProductInfo(productId);

    const rateKind = useSelector(
        (state: StakingRootState) =>
            selectStakingProductDescriptor(state, productId)?.rateKind ?? null,
    );

    const position = useSelector((state: StakingRootState) =>
        accountKey === undefined ? null : selectStakingPosition(state, accountKey, productId),
    );

    const rate = getStakingPositionRate({ position, productInfo });

    return { rate, rateKind, isPending };
};
