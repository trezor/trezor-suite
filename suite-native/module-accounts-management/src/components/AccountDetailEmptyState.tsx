import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    selectAccountByKey,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box, VStack } from '@suite-native/atoms';
import { selectIsUnrecognizedToken } from '@suite-native/tokens';
import { TransactionsEmptyState } from '@suite-native/transactions';

import { AccountDetailActionButtons } from './AccountDetailActionButtons';
import { AssetPriceCard } from './AssetPriceCard';

type AccountDetailEmptyStateProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountDetailEmptyState = ({
    accountKey,
    tokenContract,
}: AccountDetailEmptyStateProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account?.symbol);
    const isUnrecognizedToken = useSelector(
        (state: TokenDefinitionsRootState & AccountsRootState) =>
            selectIsUnrecognizedToken(state, accountKey, tokenContract),
    );

    const isPriceCardDisplayed = shallDisplayBaseCurrency && !isUnrecognizedToken;

    return (
        <VStack spacing="sp24">
            <TransactionsEmptyState />
            <Box paddingHorizontal="sp16">
                <AccountDetailActionButtons accountKey={accountKey} tokenContract={tokenContract} />
            </Box>
            {isPriceCardDisplayed && (
                <AssetPriceCard accountKey={accountKey} tokenContract={tokenContract} />
            )}
        </VStack>
    );
};
