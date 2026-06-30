import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';

import { selectTokenDecimals, selectTokenInfoEntry } from './tokenInfoSelectors';
import { fetchTokenInfoThunk } from './tokenInfoThunks';
import { type TokenInfoRootState } from './tokenInfoTypes';
import { type AccountsRootState } from '../accounts/accountsReducer';

type UseTokenDecimalsResult = {
    decimals: number | undefined;
    isLoading: boolean;
    error: boolean;
};

// Returns decimals from redux (held token or cached fetch), fetching once when missing.
export const useTokenDecimals = (
    networkSymbol: NetworkSymbol,
    contractAddress?: TokenAddress,
    accountKey?: AccountKey,
): UseTokenDecimalsResult => {
    const dispatch = useDispatch();

    const decimals = useSelector((state: AccountsRootState & TokenInfoRootState) =>
        selectTokenDecimals(state, networkSymbol, contractAddress, accountKey),
    );

    const cacheEntry = useSelector((state: TokenInfoRootState) =>
        selectTokenInfoEntry(state, networkSymbol, contractAddress),
    );

    useEffect(() => {
        // No auto-retry after a failure; in-flight dedupe lives in the thunk's condition.
        if (!contractAddress || decimals !== null || cacheEntry?.error) {
            return;
        }

        dispatch(fetchTokenInfoThunk({ symbol: networkSymbol, contract: contractAddress }));
    }, [dispatch, networkSymbol, contractAddress, accountKey, decimals, cacheEntry]);

    const error = cacheEntry?.error ?? false;

    return {
        decimals: decimals ?? undefined,
        isLoading: !!contractAddress && decimals === null && !error,
        error,
    };
};
