import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    getWrapFeeReserve,
    selectConvertedNetworkFeeInfo,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';

/**
 * Native amount the wrap form has to keep aside for the wrap transaction's own fee, in display
 * units. There is no background fee-info sync on mobile (desktop has one), so the levels the
 * estimate reads are fetched here — the form needs the reserve before the first compose, to fill
 * in "Max" and to cap the entered amount.
 */
export const useWrapFeeReserve = (symbol: NetworkSymbol | undefined) => {
    const dispatch = useDispatch();
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, symbol),
    );

    useEffect(() => {
        if (!symbol) return;

        void dispatch(updateFeeInfoThunk({ networkSymbol: symbol }));
    }, [dispatch, symbol]);

    return getWrapFeeReserve(feeInfo);
};
