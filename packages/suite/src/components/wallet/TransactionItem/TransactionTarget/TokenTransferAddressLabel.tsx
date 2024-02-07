import { ArrayElement } from '@trezor/type-utils';
import { Translation, AddressLabeling } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';
import { BlurWrapper } from '../TransactionItemBlurWrapper';

interface TokenTransferAddressLabelProps {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    type: WalletAccountTransaction['type'];
    isPhishingTransaction: boolean;
}

export const TokenTransferAddressLabel = ({
    transfer,
    type,
    isPhishingTransaction,
}: TokenTransferAddressLabelProps) => {
    if (type === 'self') {
        return <Translation id="TR_SENT_TO_SELF" />;
    }
    if (type === 'sent') {
        return (
            <BlurWrapper isBlurred={isPhishingTransaction}>
                <AddressLabeling address={transfer.to} />
            </BlurWrapper>
        );
    }

    return <BlurWrapper isBlurred={isPhishingTransaction}>{transfer.to}</BlurWrapper>;
};
