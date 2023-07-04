import React from 'react';
import { useSelector } from 'react-redux';

import { atom, useAtomValue } from 'jotai';

import { Box, Divider, Text } from '@suite-native/atoms';
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

const FiatBalance = ({ accountSymbol }: { accountSymbol: NetworkSymbol }) => {
    const selectedPoint = useAtomValue(selectedPointAtom);

    return (
        <FiatAmountFormatter
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
        <Box>
            <Box marginBottom="large" justifyContent="center" alignItems="center">
                <CryptoBalance accountSymbol={account.symbol} />
                <FiatBalance accountSymbol={account.symbol} />
                <Box flexDirection="row" alignItems="center">
                    <Box marginRight="small">
                        <Text variant="hint" color="textSubdued">
                            <GraphDateFormatter
                                firstPointDate={firstPointDate}
                                selectedPointAtom={selectedPointAtom}
                            />
                        </Text>
                    </Box>
                    <PriceChangeIndicator
                        hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                        percentageChangeAtom={percentageChangeAtom}
                    />
                </Box>
            </Box>
            <Box marginBottom="large">
                <Divider />
            </Box>
        </Box>
    );
};
