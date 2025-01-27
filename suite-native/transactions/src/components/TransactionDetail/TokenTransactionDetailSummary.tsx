import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';
import { TypedTokenTransfer } from '@suite-native/tokens';

import { VerticalSeparator } from './NetworkTransactionDetailSummary';
import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { VinVoutAddress } from '../../types';

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
    const symbol = useSelector((state: AccountsRootState) =>
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
                symbol={symbol ?? undefined}
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
