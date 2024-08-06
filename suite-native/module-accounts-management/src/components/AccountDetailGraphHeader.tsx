import { useSelector } from 'react-redux';

import { atom, useAtomValue } from 'jotai';

import { DiscreetTextTrigger, HStack, Text, VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { GraphDateFormatter, percentageDiff, PriceChangeIndicator } from '@suite-native/graph';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import {
    selectEthereumAccountTokenInfo,
    selectEthereumAccountTokenSymbol,
} from '@suite-native/ethereum-tokens';

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
    tokenDecimals,
}: {
    accountSymbol: NetworkSymbol;
    tokenSymbol?: TokenSymbol;
    tokenDecimals?: number;
    tokenAddress?: TokenAddress;
}) => {
    const selectedPoint = useAtomValue(selectedPointAtom);

    return (
        <DiscreetTextTrigger>
            <AccountDetailCryptoValue
                networkSymbol={accountSymbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
                decimals={tokenDecimals}
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

    const tokenInfo = useSelector((state: AccountsRootState) => {
        if (!tokenAddress || !account) return null;

        // We might want to add support for other networks in the future.
        if (getNetworkType(account.symbol) === 'ethereum') {
            return selectEthereumAccountTokenInfo(state, accountKey, tokenAddress);
        }

        return null;
    });
    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, tokenAddress),
    );
    const tokenDecimals = tokenInfo?.decimals;

    const firstGraphPoint = useAtomValue(referencePointAtom);

    if (!account || !tokenSymbol) return null;

    return (
        <VStack spacing="extraSmall" alignItems="center">
            <CryptoBalance
                accountSymbol={account.symbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
                tokenDecimals={tokenDecimals}
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
