import { useEffect, useState } from 'react';
import { useInterval } from 'react-use';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { FEES_UPDATE_INTERVAL, updateFeeInfoThunk } from '@suite-common/wallet-core';

import { useDispatch } from 'src/hooks/suite';

type UseRefetchFeesProps = { networkSymbol: NetworkSymbol };

export const useRefetchFees = ({ networkSymbol }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();
    const [areFeesLoading, setAreFeesLoading] = useState(false);

    const refetchFees = async () => {
        if (areFeesLoading) return;
        setAreFeesLoading(true);
        await dispatch(updateFeeInfoThunk({ networkSymbol }));
        setAreFeesLoading(false);
    };

    // Initial fetch when component mounts
    useEffect(() => {
        refetchFees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refetch fees periodically
    useInterval(refetchFees, FEES_UPDATE_INTERVAL);

    return { areFeesLoading };
};
