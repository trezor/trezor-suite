import { useEffect, useState } from 'react';
import { useInterval } from 'react-use';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { FEES_UPDATE_INTERVAL, updateFeeInfoThunk } from '@suite-common/wallet-core';

import { useDispatch } from 'src/hooks/suite';

const MIN_LOADER_LIFETIME = 1000; // [ms]

type UseRefetchFeesProps = { networkSymbol: NetworkSymbol };

export const useRefetchFees = ({ networkSymbol }: UseRefetchFeesProps) => {
    const dispatch = useDispatch();
    const [areFeesLoading, setAreFeesLoading] = useState(false);

    const refetchFees = async (minLoaderLifetime: number) => {
        if (areFeesLoading) return;
        setAreFeesLoading(true);

        /*
         Backend request is usually very quick, so ensure that the loader is visible for a bit longer,
         to draw users attention to the fees which are changing.
         It also prevents flickering of loading state.
        */
        await Promise.all([
            dispatch(updateFeeInfoThunk({ networkSymbol })),
            new Promise(resolve => setTimeout(resolve, minLoaderLifetime)),
        ]);

        setAreFeesLoading(false);
    };

    // Initial fetch when component mounts
    useEffect(() => {
        refetchFees(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refetch fees periodically
    useInterval(() => refetchFees(MIN_LOADER_LIFETIME), FEES_UPDATE_INTERVAL);

    return { areFeesLoading };
};
