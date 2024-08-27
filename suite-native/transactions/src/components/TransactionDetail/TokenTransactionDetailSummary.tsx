import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer } from '@suite-native/tokens';
import { VStack } from '@suite-native/atoms';

import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { VinVoutAddress } from '../../types';
import { VerticalSeparator } from './NetworkTransactionDetailSummary';

export const TokenTransactionDetailSummary = ({
    tokenTransfer,
    onShowMore,
}: {
    accountKey: AccountKey;
    txid: string;
    tokenTransfer: EthereumTokenTransfer;
    onShowMore: () => void;
}) => {
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
                icon={tokenTransfer.contract}
                onShowMore={onShowMore}
            />
            <TransactionDetailAddressesSection
                addressesType="outputs"
                addresses={outputAddresses}
                onShowMore={onShowMore}
            />
            <VerticalSeparator isMultiInputTransaction={inputAddresses.length > 2} />
        </VStack>
    );
};
