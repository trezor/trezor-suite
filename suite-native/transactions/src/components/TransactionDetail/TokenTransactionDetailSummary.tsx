import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { TypedTokenTransfer, WalletAccountTransaction } from '@suite-native/tokens';

import { VerticalSeparator } from './NetworkTransactionDetailSummary';
import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { VinVoutAddress } from '../../types';

type TokenTransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    accountKey: AccountKey;
    tokenTransfer: TypedTokenTransfer;
    onShowMore: () => void;
};

export const TokenTransactionDetailSummary = ({
    transaction,
    accountKey,
    tokenTransfer,
    onShowMore,
}: TokenTransactionDetailSummaryProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    // Token transfer has always only one address, so we need to wrap it to an array.
    const inputAddresses: VinVoutAddress[] = [
        { address: tokenTransfer.from, isChangeAddress: false, n: 0 },
    ];
    const outputAddresses: VinVoutAddress[] = [
        { address: tokenTransfer.to, isChangeAddress: false, n: 0 },
    ];

    return (
        <VStack>
            <TransactionDetailAddressesSection
                transaction={transaction}
                addressesType="inputs"
                addresses={inputAddresses}
                symbol={symbol ?? undefined}
                contractAddress={tokenTransfer.contract}
                onShowMore={onShowMore}
            />
            <TransactionDetailAddressesSection
                transaction={transaction}
                addressesType="outputs"
                addresses={outputAddresses}
                onShowMore={onShowMore}
            />
            <VerticalSeparator inputsCount={inputAddresses.length} />
        </VStack>
    );
};
