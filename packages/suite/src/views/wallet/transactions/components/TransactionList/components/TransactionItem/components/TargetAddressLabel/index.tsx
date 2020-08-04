import React from 'react';
import { WalletAccountTransaction } from '@wallet-types';
import { ArrayElement } from '@suite/types/utils';
import { Translation, AddressLabeling } from '@suite-components';

interface Props {
    target: ArrayElement<WalletAccountTransaction['targets']>;
    type: WalletAccountTransaction['type'];
}
const TargetAddressLabel = ({ target, type }: Props) => {
    const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;
    const addressLabel = isLocalTarget ? (
        <Translation id="TR_SENT_TO_SELF" />
    ) : (
        target.addresses?.map((a, i) =>
            type === 'sent' ? <AddressLabeling key={i} address={a} /> : <span>{a}</span>,
        )
    );
    return <>{addressLabel}</>;
};

export default TargetAddressLabel;
