import { useSelector } from 'react-redux';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';

import {
    type EarnListRootState,
    selectYieldListItems,
    selectYieldListVaultIcons,
} from '../../earnListSelectors';

type UseYieldPositionsProps = {
    yieldOpportunities: YieldDtoV2[];
};

export const useYieldPositions = ({ yieldOpportunities }: UseYieldPositionsProps) => {
    const positions = useSelector((state: EarnListRootState) =>
        selectYieldListItems(state, yieldOpportunities),
    );
    const vaultIcons = useSelector((state: EarnListRootState) =>
        selectYieldListVaultIcons(state, yieldOpportunities),
    );

    return { positions, vaultIcons };
};
