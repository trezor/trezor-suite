import { ArrayElement } from '@trezor/type-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { Translation, AddressLabeling } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';

import { BlurWrapper } from '../TransactionItemBlurWrapper';

interface TokenTransferAddressLabelProps {
    symbol: NetworkSymbol;
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    type: WalletAccountTransaction['type'];
    isPhishingTransaction: boolean;
}

export const TokenTransferAddressLabel = ({
    symbol,
    transfer,
    type,
    isPhishingTransaction,
}: TokenTransferAddressLabelProps) => {
    if (type === 'self') {
        return <Translation id="TR_SENT_TO_SELF" />;
    }
    if (type === 'sent') {
        return (
            <BlurWrapper $isBlurred={isPhishingTransaction}>
                <AddressLabeling address={transfer.to} symbol={symbol} />
            </BlurWrapper>
        );
    }

    return <BlurWrapper $isBlurred={isPhishingTransaction}>{transfer.to}</BlurWrapper>;
};
