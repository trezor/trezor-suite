import { useSelector } from 'react-redux';

import { AccountKey } from '@suite-common/wallet-types';
import { TypedTokenTransfer } from '@suite-native/tokens';
import { VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';

import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { VinVoutAddress } from '../../types';
import { VerticalSeparator } from './NetworkTransactionDetailSummary';

export const TokenTransactionDetailSummary = ({
    accountKey,
    tokenTransfer,
    onShowMore,
}: {
    accountKey: AccountKey;
    txid: string;
    tokenTransfer: TypedTokenTransfer;
    onShowMore: () => void;
}) => {
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    // Token transfer has always only one address, so we need to wrap it to an array.
    const inputAddresses: VinVoutAddress[] = [
        { address: tokenTransfer.from, isChangeAddress: false },
    ];
    const outputAddresses: VinVoutAddress[] = [
        { address: tokenTransfer.to, isChangeAddress: false },
    ];

    return (
        <VStack>
            <TransactionDetailAddressesSection
                addressesType="inputs"
                addresses={inputAddresses}
                networkSymbol={networkSymbol ?? undefined}
                contractAddress={tokenTransfer.contract}
                onShowMore={onShowMore}
            />
            <TransactionDetailAddressesSection
                addressesType="outputs"
                addresses={outputAddresses}
                onShowMore={onShowMore}
            />
            <VerticalSeparator inputsCount={inputAddresses.length} />
        </VStack>
    );
};
