import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectAreFeesLoading,
    useFetchFeesOnce,
    useRefetchFees,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';

export type UseFeesFetchingProps = {
    accountKey: AccountKey;
    isRefetchDisabled?: boolean;
};

export const useFeesFetching = ({ accountKey, isRefetchDisabled }: UseFeesFetchingProps) => {
    // Account and Network Data
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // Fee Data
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );

    // Fetch fees on mount
    useFetchFeesOnce({ networkSymbol: account?.symbol });

    // Refetch fees when needed
    useRefetchFees({
        networkSymbol: account?.symbol,
        isDisabled: isRefetchDisabled,
    });

    return {
        areFeesLoading,
    };
};

export type FeesFetchingReturn = ReturnType<typeof useFeesFetching>;
