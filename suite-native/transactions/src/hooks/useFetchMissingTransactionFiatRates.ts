import { useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    type TransactionsRootState,
    selectAccountTransactions,
    selectBaseCurrency,
    updateMissingTxFiatRatesThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { createWeakMapSelector, injectDispatch } from '@trezor/redux-utils';

const createMemoizedSelector = createWeakMapSelector.withTypes<TransactionsRootState>();

const selectKeyedAccountTransactions = createMemoizedSelector(
    [(_state, accountKey: AccountKey) => accountKey, selectAccountTransactions],
    (accountKey, transactions) => ({ accountKey, transactions }),
);

type UseFetchMissingTransactionFiatRatesParams = {
    accountKeys: readonly AccountKey[];
    isEnabled?: boolean;
};

export const useFetchMissingTransactionFiatRates = ({
    accountKeys,
    isEnabled = true,
}: UseFetchMissingTransactionFiatRatesParams) => {
    const { dispatch } = useServices(injectDispatch);
    const localCurrency = useSelector(selectBaseCurrency);
    // Keeps the effect stable when a caller passes a new accountKeys array on every render.
    const keyedAccountTransactions = useSelector(
        (state: TransactionsRootState) =>
            accountKeys.map(accountKey => selectKeyedAccountTransactions(state, accountKey)),
        shallowEqual,
    );

    useFocusEffect(
        useCallback(
            function fetchMissingFiatRates() {
                if (!isEnabled) return;

                keyedAccountTransactions
                    .filter(({ transactions }) => transactions.length > 0)
                    .forEach(({ accountKey }) =>
                        dispatch(updateMissingTxFiatRatesThunk({ localCurrency, accountKey })),
                    );
            },
            [isEnabled, dispatch, localCurrency, keyedAccountTransactions],
        ),
    );
};
