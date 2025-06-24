import { useEffect } from 'react';
import { useInterval } from 'react-use';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FEES_UPDATE_INTERVAL_MILLISECONDS,
    FEE_UPDATE_DELAY_MILLISECONDS,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';

import { useDispatch } from 'src/hooks/suite';

type UseRefetchFeesProps = { networkSymbol: NetworkSymbol; isDisabled?: boolean };

// Fetch fees only once when component mounts, or when it is enabled at a later time.
export const useFetchFeesOnce = ({ networkSymbol, isDisabled }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (isDisabled === true) return;
        dispatch(updateFeeInfoThunk({ networkSymbol }));
    }, [dispatch, networkSymbol, isDisabled]);
};

// Refetch fees periodically, incl. loading behavior
export const useRefetchFees = ({ networkSymbol, isDisabled }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    useInterval(() => {
        if (isDisabled === true) return;
        dispatch(
            updateFeeInfoThunk({ networkSymbol, artificialDelay: FEE_UPDATE_DELAY_MILLISECONDS }),
        );
    }, FEES_UPDATE_INTERVAL_MILLISECONDS);
};
