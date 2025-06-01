import { useEffect } from 'react';
import { useInterval } from 'react-use';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FEES_UPDATE_INTERVAL_MILLISECONDS,
    delayedUpdateFeeInfoThunk,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';

import { useDispatch } from 'src/hooks/suite';

type UseRefetchFeesProps = { networkSymbol: NetworkSymbol };

export const useRefetchFees = ({ networkSymbol }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    // Initial fetch only when component mounts
    useEffect(() => {
        dispatch(updateFeeInfoThunk({ networkSymbol }));
    }, [dispatch, networkSymbol]);

    // Refetch fees periodically incl. loading behavior
    useInterval(() => {
        dispatch(delayedUpdateFeeInfoThunk({ networkSymbol }));
    }, FEES_UPDATE_INTERVAL_MILLISECONDS);
};
