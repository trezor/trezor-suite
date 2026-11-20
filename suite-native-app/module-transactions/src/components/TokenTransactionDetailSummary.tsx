import { createTokenTargetId } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { type VinVoutAddress } from '@suite-native/transactions';

import { VerticalSeparator } from './NetworkTransactionDetailSummary';
import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';

type TokenTransactionDetailSummaryProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer: TypedTokenTransfer;
    onShowMore: () => void;
};

export const TokenTransactionDetailSummary = ({
    transaction,
    tokenTransfer,
    onShowMore,
}: TokenTransactionDetailSummaryProps) => {
    // Token transfer has always only one address, so we need to wrap it to an array.
    const inputAddresses: VinVoutAddress[] = [
        {
            address: tokenTransfer.from,
            isChangeAddress: false,
            outputIndex: 0,
            txTargetId: createTokenTargetId(tokenTransfer),
        },
    ];
    const outputAddresses: VinVoutAddress[] = [
        {
            address: tokenTransfer.to,
            isChangeAddress: false,
            outputIndex: 0,
            txTargetId: createTokenTargetId(tokenTransfer),
        },
    ];

    return (
        <VStack>
            <TransactionDetailAddressesSection
                transaction={transaction}
                addressesType="inputs"
                addresses={inputAddresses}
                onShowMore={onShowMore}
                showOutputLabels={false}
            />
            <TransactionDetailAddressesSection
                transaction={transaction}
                addressesType="outputs"
                addresses={outputAddresses}
                onShowMore={onShowMore}
                showOutputLabels={false}
            />
            <VerticalSeparator inputsCount={inputAddresses.length} />
        </VStack>
    );
};
