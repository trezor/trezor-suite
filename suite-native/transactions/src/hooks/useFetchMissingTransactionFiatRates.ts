import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type TransactionsRootState,
    selectAccountTransactions,
    selectBaseCurrency,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UseFetchMissingTransactionFiatRatesParams = {
    accountKey?: AccountKey;
    isEnabled?: boolean;
};

export const useFetchMissingTransactionFiatRates = ({
    accountKey,
    isEnabled = true,
}: UseFetchMissingTransactionFiatRatesParams) => {
    const { dispatch } = useServices(injectDispatch);
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
