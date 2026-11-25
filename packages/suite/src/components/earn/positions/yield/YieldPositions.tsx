import { useSelector } from 'react-redux';

import { useEarnMissingRateTickersQuery } from '@suite-common/earn';
import {
    type EarnListRootState,
    type YieldListItem,
    selectYieldListItems,
    useYieldOpportunities,
} from '@suite-common/wallet-core';

import { EarnPositionsList } from '../EarnPositionsList';
import { YieldPositionCard } from './YieldPositionCard';

export const YieldPositions = () => {
    const { yieldOpportunities, isLoading, isError, refetch } = useYieldOpportunities();

    useEarnMissingRateTickersQuery();

    const positions = useSelector((state: EarnListRootState) =>
        selectYieldListItems(state, yieldOpportunities),
    );

    const render = (position: YieldListItem) => (
        <YieldPositionCard key={position.id} position={position} />
    );

    if (positions.length === 0 && !isLoading && !isError) {
        return null;
    }

    return (
        <EarnPositionsList
            translationId="TR_EARN_DEFI_YIELD"
            items={positions}
            render={render}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
        />
    );
};
