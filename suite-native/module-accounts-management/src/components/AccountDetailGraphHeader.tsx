import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useAtomValue, useSetAtom } from 'jotai';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { DiscreetTextTrigger, VStack } from '@suite-native/atoms';
import { selectAccountTokenSymbol } from '@suite-native/tokens';
import { GraphFiatBalance } from '@suite-native/graph';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import {
    emptyGraphPoint,
    hasPriceIncreasedAtom,
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../accountDetailGraphAtoms';

type AccountBalanceProps = {
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
};

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

export const AccountDetailGraphHeader = ({ accountKey, tokenAddress }: AccountBalanceProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenAddress),
    );
    const setPoint = useSetAtom(selectedPointAtom);

    // Reset selected point on unmount so that it doesn't display on device change
    useEffect(() => () => setPoint(emptyGraphPoint), [setPoint]);

    if (!account) return null;

    return (
        <VStack spacing="extraSmall" alignItems="center">
            <CryptoBalance
                accountSymbol={account.symbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
            />
            <GraphFiatBalance
                selectedPointAtom={selectedPointAtom}
                referencePointAtom={referencePointAtom}
                percentageChangeAtom={percentageChangeAtom}
                hasPriceIncreasedAtom={hasPriceIncreasedAtom}
            />
        </VStack>
    );
};
