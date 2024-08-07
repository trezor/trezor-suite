import { useSelector } from 'react-redux';

import { atom, useAtomValue } from 'jotai';

import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { DiscreetTextTrigger, HStack, Text, VStack } from '@suite-native/atoms';
import { selectEthereumAccountTokenSymbol } from '@suite-native/ethereum-tokens';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import { GraphDateFormatter, PriceChangeIndicator, percentageDiff } from '@suite-native/graph';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';

type AccountBalanceProps = {
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
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

const CryptoBalance = ({
    accountSymbol,
    tokenSymbol,
    tokenAddress,
}: {
    accountSymbol: NetworkSymbol;
    tokenSymbol?: TokenSymbol | null;
    tokenAddress?: TokenAddress;
}) => {
    const selectedPoint = useAtomValue(selectedPointAtom);

    return (
        <DiscreetTextTrigger>
            <AccountDetailCryptoValue
                networkSymbol={accountSymbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
                value={selectedPoint.cryptoBalance}
            />
        </DiscreetTextTrigger>
    );
};

const FiatBalance = () => {
    const selectedPoint = useAtomValue(selectedPointAtom);

    return (
        <DiscreetTextTrigger>
            <FiatBalanceFormatter value={String(selectedPoint.value)} />
        </DiscreetTextTrigger>
    );
};

export const AccountDetailGraphHeader = ({ accountKey, tokenAddress }: AccountBalanceProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, tokenAddress),
    );

    const firstGraphPoint = useAtomValue(referencePointAtom);

    if (!account) return null;

    return (
        <VStack spacing="extraSmall" alignItems="center">
            <CryptoBalance
                accountSymbol={account.symbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
            />
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
