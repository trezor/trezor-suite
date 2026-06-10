import { useDispatch, useSelector } from 'react-redux';

import { mobileQueryKeys, useQuery } from '@suite-common/react-query';
import { selectBaseCurrency, updateMissingTxFiatRatesThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type UseFiatRatesForTransactionsQueryParams = {
    accountKey: AccountKey;
    // Include page so the query re-fires when new pages are loaded and may have missing rates.
    page: number;
    enabled: boolean;
};

export const useFiatRatesForTransactionsQuery = ({
    accountKey,
    page,
    enabled,
}: UseFiatRatesForTransactionsQueryParams) => {
    const dispatch = useDispatch();
    const localCurrency = useSelector(selectBaseCurrency);

    return useQuery({
        queryKey: mobileQueryKeys.txFiatRates(accountKey, localCurrency, page),
        queryFn: () =>
            dispatch(updateMissingTxFiatRatesThunk({ localCurrency, accountKey }))
                .unwrap()
                .then(() => null),
        enabled,
        staleTime: 10 * 60 * 1000,
    });
};
