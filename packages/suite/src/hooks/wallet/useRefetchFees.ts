import { useEffect } from 'react';
import { useInterval } from 'react-use';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FEES_UPDATE_INTERVAL_MILLISECONDS,
    FEE_UPDATE_DELAY_MILLISECONDS,
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
        dispatch(
            updateFeeInfoThunk({ networkSymbol, artificialDelay: FEE_UPDATE_DELAY_MILLISECONDS }),
        );
    }, FEES_UPDATE_INTERVAL_MILLISECONDS);
};
