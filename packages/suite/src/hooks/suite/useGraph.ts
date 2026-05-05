import { useMemo } from 'react';

import { type Account } from '@suite-common/wallet-types';

import * as graphActions from 'src/actions/wallet/graphActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type GraphRange } from 'src/types/wallet/graph';

export const useGraph = () => {
    const dispatch = useDispatch();

    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);

    const actions = useMemo(
        () => ({
            setSelectedRange: (range: GraphRange) => dispatch(graphActions.setSelectedRange(range)),
            updateGraphData: (accounts: Account[]) =>
                dispatch(graphActions.updateGraphData({ accounts })),
        }),
        [dispatch],
    );

    return {
        selectedRange,
        ...actions,
    };
};
