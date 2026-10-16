import { useSelector } from 'react-redux';

import {
    type TransactionsRootState,
    selectAccountTransactions,
    useHistoricFiatRates,
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
    const transactions = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, accountKey ?? null),
    );

    useHistoricFiatRates({ accountKey, transactions, isDisabled: !isEnabled });
};
