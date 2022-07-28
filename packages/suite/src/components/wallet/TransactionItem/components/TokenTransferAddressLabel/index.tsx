import React from 'react';
import { Translation, AddressLabeling } from '@suite-components';
import { WalletAccountTransaction } from '@wallet-types';
import { ArrayElement } from '@trezor/type-utils';

interface Props {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    type: WalletAccountTransaction['type'];
}

const TokenTransferAddressLabel = ({ transfer, type }: Props) => {
    let addr: JSX.Element | string | undefined = transfer.to;
    if (type === 'self') addr = <Translation id="TR_SENT_TO_SELF" />;
    if (type === 'sent') addr = <AddressLabeling address={transfer.to} />;
    return <>{addr}</>;
};

export default TokenTransferAddressLabel;
