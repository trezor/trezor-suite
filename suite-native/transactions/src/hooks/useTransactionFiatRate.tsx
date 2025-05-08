import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    FiatRatesRootState,
    selectHistoricFiatRatesByTimestamp,
    selectLocalCurrency,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

export const useTransactionFiatRate = ({
    accountKey,
    transaction,
    tokenAddress,
}: {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
}) => {
    const dispatch = useDispatch();

    const localCurrency = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, localCurrency, tokenAddress);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );
    const transactionHasFiatRates = !!historicRate;

    useEffect(() => {
        if (transaction && !transactionHasFiatRates) {
            dispatch(updateTxsFiatRatesThunk({ accountKey, txs: [transaction], localCurrency }));
        }
    }, [transaction, transactionHasFiatRates, accountKey, dispatch, localCurrency]);

    return historicRate;
};
