import { useMemo } from 'react';

import { Account } from '@suite-common/wallet-types';

import * as graphActions from 'src/actions/wallet/graphActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { GraphRange, GraphScale } from 'src/types/wallet/graph';

export const useGraph = () => {
    const dispatch = useDispatch();

    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const selectedView = useSelector(state => state.wallet.graph.selectedView);

    const actions = useMemo(
        () => ({
            setSelectedRange: (range: GraphRange) => dispatch(graphActions.setSelectedRange(range)),
            setSelectedView: (view: GraphScale) => dispatch(graphActions.setSelectedView(view)),
            updateGraphData: (
                accounts: Account[],
                options?: {
                    newAccountsOnly?: boolean;
                },
            ) => dispatch(graphActions.updateGraphData(accounts, options)),
        }),
        [dispatch],
    );

    return {
        selectedRange,
        selectedView,
        ...actions,
    };
};
