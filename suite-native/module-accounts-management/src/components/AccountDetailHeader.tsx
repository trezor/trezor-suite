import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import type { DeviceRootState } from '@suite-common/device';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountFormattedBalance,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseCurrencyAmount,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { DiscreetTextTrigger, VStack } from '@suite-native/atoms';
import {
    GraphBaseCurrencyBalance,
    selectIsHistoryEnabledAccountByAccountKey,
} from '@suite-native/graph';
import {
    type TokensRootState,
    selectAccountTokenBalance,
    selectAccountTokenSymbol,
} from '@suite-native/tokens';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import {
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../accountDetailGraphAtoms';

type AccountBalanceProps = {
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
    totalFiatBalance: BaseCurrencyAmount;
};

const CryptoBalance = ({
    symbol,
    tokenSymbol,
    totalCryptoBalance,
}: {
    symbol: NetworkSymbol;
    tokenSymbol?: TokenSymbol | null;
    totalCryptoBalance: string | null;
}) => {
    const selectedPoint = useAtomValue(selectedPointAtom);
    const value = selectedPoint?.cryptoBalance || totalCryptoBalance || '0';

    return (
        <DiscreetTextTrigger>
            <AccountDetailCryptoValue symbol={symbol} tokenSymbol={tokenSymbol} value={value} />
        </DiscreetTextTrigger>
    );
};

export const AccountDetailHeader = ({
    accountKey,
    tokenAddress,
    totalFiatBalance,
}: AccountBalanceProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account?.symbol);
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenAddress),
    );
    const isHistoryEnabledAccount = useSelector((state: AccountsRootState) =>
        selectIsHistoryEnabledAccountByAccountKey(state, accountKey),
    );
    const totalCryptoBalance = useSelector(
        (
            state: AccountsRootState &
                DeviceRootState &
                TokenDefinitionsRootState &
                TransactionsRootState,
        ) => {
            if (tokenSymbol) {
                return selectAccountTokenBalance(state, accountKey, tokenAddress);
            }

            return selectAccountFormattedBalance(state, accountKey);
        },
    );

    if (!account) return null;

    return (
        <VStack spacing="sp4" alignItems="center">
            {shallDisplayBaseCurrency && (
                <CryptoBalance
                    symbol={account.symbol}
                    tokenSymbol={tokenSymbol}
                    totalCryptoBalance={totalCryptoBalance}
                />
            )}

            <GraphBaseCurrencyBalance
                selectedPointAtom={selectedPointAtom}
                referencePointAtom={referencePointAtom}
                percentageChangeAtom={percentageChangeAtom}
                showChange={isHistoryEnabledAccount}
                totalBaseCurrencyBalance={totalFiatBalance}
                isHistoryEnabledAccount={isHistoryEnabledAccount}
            />
        </VStack>
    );
};
