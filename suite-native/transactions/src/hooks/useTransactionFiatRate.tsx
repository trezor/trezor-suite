import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    FiatRatesRootState,
    selectBaseCurrency,
    selectHistoricFiatRatesByTimestamp,
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

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, baseCurrencyCode, tokenAddress);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );
    const transactionHasFiatRates = !!historicRate;

    useEffect(() => {
        if (transaction && !transactionHasFiatRates) {
            dispatch(
                updateTxsFiatRatesThunk({
                    accountKey,
                    txs: [transaction],
                    baseCurrencyCode,
                }),
            );
        }
    }, [transaction, transactionHasFiatRates, accountKey, dispatch, baseCurrencyCode]);

    return historicRate;
};
