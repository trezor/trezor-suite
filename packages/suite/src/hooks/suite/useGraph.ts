import { useMemo } from 'react';

import { type Account } from '@suite-common/wallet-types';

import * as graphActions from 'src/actions/wallet/graphActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type GraphRange, type GraphScale } from 'src/types/wallet/graph';

export const useGraph = () => {
    const dispatch = useDispatch();

    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const selectedView = useSelector(state => state.wallet.graph.selectedView);

    const actions = useMemo(
        () => ({
            setSelectedRange: (range: GraphRange) => dispatch(graphActions.setSelectedRange(range)),
            setSelectedView: (view: GraphScale) => dispatch(graphActions.setSelectedView(view)),
            updateGraphData: (accounts: Account[]) =>
                dispatch(graphActions.updateGraphData({ accounts })),
        }),
        [dispatch],
    );

    return {
        selectedRange,
        selectedView,
        ...actions,
    };
};
