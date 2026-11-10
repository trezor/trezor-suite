import { useMemo } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from './useSelector';
import * as graphActions from '../../actions/wallet/graphActions';
import { selectGraphSelectedRange } from '../../reducers/wallet/graphReducer';
import { type GraphRange } from '../../types/wallet/graph';

export const useGraph = () => {
    const { dispatch } = useServices(injectDispatch);

    const selectedRange = useSelector(selectGraphSelectedRange);

    const actions = useMemo(
        () => ({
            setSelectedRange: (range: GraphRange) => dispatch(graphActions.setSelectedRange(range)),
            updateGraphData: (accounts: Account[]) =>
                dispatch(graphActions.updateGraphDataThunk({ accounts })),
        }),
        [dispatch],
    );

    return {
        selectedRange,
        ...actions,
    };
};
