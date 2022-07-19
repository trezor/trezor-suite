import React from 'react';
import { Translation, AddressLabeling } from '@suite-components';
import { WalletAccountTransaction } from '@wallet-types';
import { ArrayElement } from '@trezor/type-utils';

interface TokenTransferAddressLabelProps {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    type: WalletAccountTransaction['type'];
}

export const TokenTransferAddressLabel = ({ transfer, type }: TokenTransferAddressLabelProps) => {
    if (type === 'self') {
        return <Translation id="TR_SENT_TO_SELF" />;
    }
    if (type === 'sent') {
        return <AddressLabeling address={transfer.to} />;
    }

    return <>{transfer.to}</>;
};
