import { useMemo } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';

import * as graphActions from 'src/actions/wallet/graphActions';
import { useSelector } from 'src/hooks/suite';
import { selectGraphSelectedRange } from 'src/reducers/wallet/graphReducer';
import { type GraphRange } from 'src/types/wallet/graph';

export const useGraph = () => {
    const dispatch = useDispatch();

    const selectedRange = useSelector(selectGraphSelectedRange);

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
