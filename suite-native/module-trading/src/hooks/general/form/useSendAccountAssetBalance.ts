import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountFormattedBalance,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import type { UseFormReturn } from '@suite-native/forms';
import { selectAccountTokenBalance } from '@suite-native/tokens';
import {
    type ExchangeFormType,
    type ExchangeFormValues,
    type SellFormType,
    type SellFormValues,
} from '@suite-native/trading-types';

export const useSendAccountAssetBalance = (
    form: ExchangeFormType | SellFormType,
    setBalance: (balance: string | undefined) => unknown,
    setSendSymbol: (currency: string | undefined) => unknown,
    setContractAddress: (contractAddress: TokenAddress | undefined) => unknown,
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
        setSendSymbol(sendAccount?.symbol);
        setContractAddress(sendAsset?.contractAddress);
    }, [setSendSymbol, setContractAddress, sendAsset?.contractAddress, sendAccount?.symbol]);
};
