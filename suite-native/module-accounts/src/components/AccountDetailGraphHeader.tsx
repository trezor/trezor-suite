import React from 'react';
import { useSelector } from 'react-redux';

import { atom, useAtomValue } from 'jotai';

import { HStack, VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    emptyGraphPoint,
    GraphDateFormatter,
    percentageDiff,
    PriceChangeIndicator,
} from '@suite-native/graph';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';

type AccountBalanceProps = {
    accountKey: string;
};

export const selectedPointAtom = atom<FiatGraphPointWithCryptoBalance>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPointWithCryptoBalance>(emptyGraphPoint);

const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);
    return percentageDiff(referencePoint.value, selectedPoint.value);
});

const hasPriceIncreasedAtom = atom(get => {
    const percentageChange = get(percentageChangeAtom);
    return percentageChange >= 0;
});

const CryptoBalance = ({ accountSymbol }: { accountSymbol: NetworkSymbol }) => {
    const selectedPoint = useAtomValue(selectedPointAtom);

    return (
        <AccountDetailCryptoValue
            networkSymbol={accountSymbol}
            value={selectedPoint.cryptoBalance}
        />
    );
};

const fiatBalanceStyle = prepareNativeStyle(utils => ({
    marginBottom: -utils.spacings.small,
}));

const FiatBalance = ({ accountSymbol }: { accountSymbol: NetworkSymbol }) => {
    const selectedPoint = useAtomValue(selectedPointAtom);
    const { applyStyle } = useNativeStyles();

    return (
        <FiatAmountFormatter
            style={applyStyle(fiatBalanceStyle)}
            value={String(selectedPoint.value)}
            network={accountSymbol}
            variant="titleLarge"
            adjustsFontSizeToFit
            numberOfLines={1}
        />
    );
};

export const AccountDetailGraphHeader = ({ accountKey }: AccountBalanceProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { date: firstPointDate } = useAtomValue(referencePointAtom);

    if (!account) return null;

    return (
        <VStack spacing="small" alignItems="center">
            <CryptoBalance accountSymbol={account.symbol} />
            <FiatBalance accountSymbol={account.symbol} />
            <HStack>
                <GraphDateFormatter
                    firstPointDate={firstPointDate}
                    selectedPointAtom={selectedPointAtom}
                />
                <PriceChangeIndicator
                    hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                    percentageChangeAtom={percentageChangeAtom}
                />
            </HStack>
        </VStack>
    );
};
