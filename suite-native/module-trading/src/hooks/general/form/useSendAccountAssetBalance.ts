import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountFormattedBalance,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type Control, type FieldValues, type Path, useWatch } from '@suite-native/forms';
import { selectAccountTokenBalance } from '@suite-native/tokens';
import { type ExchangeFormValues } from '@suite-native/trading-types';

type UseSendAccountAssetBalanceParams<TFieldValues extends FieldValues> = {
    control: Control<TFieldValues>;
    setBalance: (balance: string | undefined) => unknown;
    setSendSymbol: (currency: string | undefined) => unknown;
    setContractAddress: (contractAddress: TokenAddress | undefined) => unknown;
    setAccountKey: (accountKey: AccountKey | undefined) => void;
};

export const useSendAccountAssetBalance = <TFieldValues extends FieldValues>({
    control,
    setBalance,
    setSendSymbol,
    setContractAddress,
    setAccountKey,
}: UseSendAccountAssetBalanceParams<TFieldValues>) => {
    const [sendAccount, sendAsset] = useWatch({
        control,
        name: ['sendAccount', 'sendAsset'] as Path<TFieldValues>[],
    }) as unknown as [ExchangeFormValues['sendAccount'], ExchangeFormValues['sendAsset']];
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
        setAccountKey(accountKey);
    }, [
        setSendSymbol,
        setContractAddress,
        setAccountKey,
        sendAsset?.contractAddress,
        sendAccount?.symbol,
        accountKey,
    ]);
};
