import { AccountKey } from '@suite-common/wallet-types';
import { EthereumTokenTransfer } from '@suite-native/ethereum-tokens';
import { VStack } from '@suite-native/atoms';

import { TransactionDetailAddressesSection } from './TransactionDetailAddressesSection';
import { TransactionDetailStatusSection } from './TransactionDetailStatusSection';
import { VinVoutAddress } from '../../types';

export const TokenTransactionDetailSummary = ({
    accountKey,
    txid,
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
            <TransactionDetailStatusSection txid={txid} accountKey={accountKey} />
            <TransactionDetailAddressesSection
                addressesType="outputs"
                addresses={outputAddresses}
                onShowMore={onShowMore}
            />
        </VStack>
    );
};
