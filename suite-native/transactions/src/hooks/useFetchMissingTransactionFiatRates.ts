import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type TransactionsRootState,
    selectAccountTransactions,
    selectBaseCurrency,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type UseFetchMissingTransactionFiatRatesParams = {
    accountKey?: AccountKey;
    isEnabled?: boolean;
};

export const useFetchMissingTransactionFiatRates = ({
    accountKey,
    isEnabled = true,
}: UseFetchMissingTransactionFiatRatesParams) => {
    const dispatch = useDispatch();
    const localCurrency = useSelector(selectBaseCurrency);
    const transactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, accountKey ?? null),
    );

    useEffect(() => {
        if (isEnabled) {
            dispatch(updateMissingTxFiatRatesThunk({ localCurrency, accountKey }));
        }
    }, [isEnabled, dispatch, localCurrency, accountKey, transactions]);
};
