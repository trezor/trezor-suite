import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    TransactionsRootState,
    selectAccountByKey,
    selectAccountFormattedBalance,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { DiscreetTextTrigger, VStack } from '@suite-native/atoms';
import { GraphFiatBalance } from '@suite-native/graph';
import { selectIsHistoryEnabledAccountByAccountKey } from '@suite-native/graph/src/selectors';
import {
    TokensRootState,
    selectAccountTokenBalance,
    selectAccountTokenSymbol,
} from '@suite-native/tokens';

import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import {
    hasPriceIncreasedAtom,
    percentageChangeAtom,
    referencePointAtom,
    selectedPointAtom,
} from '../accountDetailGraphAtoms';

type AccountBalanceProps = {
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
    totalFiatBalance: string;
};

const CryptoBalance = ({
    symbol,
    tokenSymbol,
    tokenAddress,
    totalCryptoBalance,
}: {
    symbol: NetworkSymbol;
    tokenSymbol?: TokenSymbol | null;
    tokenAddress?: TokenAddress;
    totalCryptoBalance: string | null;
}) => {
    const selectedPoint = useAtomValue(selectedPointAtom);
    const value = selectedPoint?.cryptoBalance || totalCryptoBalance || '0';

    return (
        <DiscreetTextTrigger>
            <AccountDetailCryptoValue
                symbol={symbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
                value={value}
            />
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
            <CryptoBalance
                symbol={account.symbol}
                tokenSymbol={tokenSymbol}
                tokenAddress={tokenAddress}
                totalCryptoBalance={totalCryptoBalance}
            />
            <GraphFiatBalance
                selectedPointAtom={selectedPointAtom}
                referencePointAtom={referencePointAtom}
                percentageChangeAtom={percentageChangeAtom}
                hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                showChange={isHistoryEnabledAccount}
                totalFiatBalance={totalFiatBalance}
                isHistoryEnabledAccount={isHistoryEnabledAccount}
            />
        </VStack>
    );
};
