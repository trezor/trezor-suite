import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FeesRootState,
    selectAreFeesLoading,
    useFetchFeesOnce,
    useRefetchFees,
} from '@suite-common/wallet-core';

export type UseFeesFetchingProps = {
    networkSymbol: NetworkSymbol | undefined;
    isRefetchDisabled?: boolean;
};

export const useFeesFetching = ({ networkSymbol, isRefetchDisabled }: UseFeesFetchingProps) => {
    // Fee Data
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, networkSymbol),
    );

    // Fetch fees on mount
    useFetchFeesOnce({ networkSymbol });

    // Refetch fees when needed
    useRefetchFees({
        networkSymbol,
        isDisabled: isRefetchDisabled,
    });

    return {
        areFeesLoading,
    };
};
