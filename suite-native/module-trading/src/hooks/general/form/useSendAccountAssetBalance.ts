import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    AccountsRootState,
    DeviceRootState,
    TransactionsRootState,
    selectAccountFormattedBalance,
} from '@suite-common/wallet-core';
import type { UseFormReturn } from '@suite-native/forms';
import { selectAccountTokenBalance } from '@suite-native/tokens';

import { ExchangeFormType, ExchangeFormValues } from '../../../types/exchange';
import { SellFormType, SellFormValues } from '../../../types/sell';

export const useSendAccountAssetBalance = (
    form: ExchangeFormType | SellFormType,
    setBalance: (balance: string | undefined) => unknown,
    setSendSymbol: (currency: string | undefined) => unknown,
) => {
    const { watch } = form as UseFormReturn<ExchangeFormValues | SellFormValues>;
    const [sendAccount, sendAsset] = watch(['sendAccount', 'sendAsset']);
    const accountKey = sendAccount?.key;

    const balance = useSelector(
        (
            state: AccountsRootState &
                DeviceRootState &
                TokenDefinitionsRootState &
                TransactionsRootState,
        ) => {
            if (!accountKey || !sendAsset) {
                return undefined;
            }

            const tokenAddress = sendAsset?.contractAddress;

            return tokenAddress
                ? selectAccountTokenBalance(state, accountKey, tokenAddress)
                : selectAccountFormattedBalance(state, accountKey);
        },
    );

    useEffect(() => {
        setBalance(balance === null ? undefined : balance);
    }, [setBalance, balance]);

    useEffect(() => {
        setSendSymbol(sendAsset?.symbol);
    }, [setSendSymbol, sendAsset]);
};
