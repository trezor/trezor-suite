import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { FEES_UPDATE_INTERVAL_MILLISECONDS, FEE_UPDATE_DELAY_MILLISECONDS } from '../feesConstants';
import { updateFeeInfoThunk } from '../feesThunks';

type UseRefetchFeesProps = { networkSymbol?: NetworkSymbol; isDisabled?: boolean };

export const useFetchFeesOnce = ({ networkSymbol, isDisabled }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (isDisabled === true || networkSymbol === undefined) return;
        dispatch(updateFeeInfoThunk({ networkSymbol }));
    }, [dispatch, networkSymbol, isDisabled]);
};

// Refetch fees periodically, incl. loading behavior
export const useRefetchFees = ({ networkSymbol, isDisabled }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (isDisabled === true || !networkSymbol) return;

        const intervalId = setInterval(() => {
            dispatch(
                updateFeeInfoThunk({
                    networkSymbol,
                    artificialDelay: FEE_UPDATE_DELAY_MILLISECONDS,
                }),
            );
        }, FEES_UPDATE_INTERVAL_MILLISECONDS);

        // Cleanup interval when component unmounts or dependencies change
        return () => clearInterval(intervalId);
    }, [dispatch, networkSymbol, isDisabled]);
};
