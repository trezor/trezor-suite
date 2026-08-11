import { useSelector } from 'react-redux';

import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import {
    type AccountsRootState,
    selectAccountByKey,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { TransactionsEmptyState } from '@suite-native/transactions';

import { selectIsUnrecognizedToken } from '../selectors';
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
            <TransactionsEmptyState accountKey={accountKey} />
            {isPriceCardDisplayed && (
                <AssetPriceCard accountKey={accountKey} tokenContract={tokenContract} />
            )}
        </VStack>
    );
};
