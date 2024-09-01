import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    FiatRatesRootState,
    selectHistoricFiatRatesByTimestamp,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { selectFiatCurrencyCode, SettingsSliceRootState } from '@suite-native/settings';
import { getFiatRateKey } from '@suite-common/wallet-utils';

export const useTransactionFiatRates = ({
    accountKey,
    transaction,
    tokenAddress,
}: {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
}) => {
    const dispatch = useDispatch();

    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode, tokenAddress);
    const historicRate = useSelector((state: FiatRatesRootState) =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );
    const localCurrency = useSelector((state: SettingsSliceRootState) =>
        selectFiatCurrencyCode(state),
    );
    const transactionHasFiatRates = !!historicRate;

    useEffect(() => {
        if (transaction && !transactionHasFiatRates) {
            dispatch(updateTxsFiatRatesThunk({ accountKey, txs: [transaction], localCurrency }));
        }
    }, [transaction, transactionHasFiatRates, accountKey, dispatch, localCurrency]);

    return historicRate;
};
