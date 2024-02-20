import { useSelector } from 'react-redux';

import { atom, useAtomValue } from 'jotai';

import { HStack, Text, VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { GraphDateFormatter, percentageDiff, PriceChangeIndicator } from '@suite-native/graph';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';

type AccountBalanceProps = {
    accountKey: string;
};

const emptyGraphPoint: FiatGraphPointWithCryptoBalance = {
    value: 0,
    date: new Date(0),
    cryptoBalance: '0',
};

export const selectedPointAtom = atom<FiatGraphPointWithCryptoBalance>(emptyGraphPoint);

// reference is usually first point, same as Revolut does in their app
export const referencePointAtom = atom<FiatGraphPointWithCryptoBalance | null>(null);

const percentageChangeAtom = atom(get => {
    const selectedPoint = get(selectedPointAtom);
    const referencePoint = get(referencePointAtom);
    if (!referencePoint) return 0;

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

const FiatBalance = () => {
    const selectedPoint = useAtomValue(selectedPointAtom);

    return <FiatBalanceFormatter value={String(selectedPoint.value)} />;
};

export const AccountDetailGraphHeader = ({ accountKey }: AccountBalanceProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const firstGraphPoint = useAtomValue(referencePointAtom);

    if (!account) return null;

    return (
        <VStack spacing="extraSmall" alignItems="center">
            <CryptoBalance accountSymbol={account.symbol} />
            <FiatBalance />
            <HStack alignItems="center">
                {firstGraphPoint ? (
                    <>
                        <GraphDateFormatter
                            firstPointDate={firstGraphPoint.date}
                            selectedPointAtom={selectedPointAtom}
                        />
                        <PriceChangeIndicator
                            hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                            percentageChangeAtom={percentageChangeAtom}
                        />
                    </>
                ) : (
                    <Text>{' ' /* just placeholder to avoid layout shift */}</Text>
                )}
            </HStack>
        </VStack>
    );
};
