import React from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from '@wallet-types';
import { ArrayElement } from '@suite/types/utils';
import { Translation, AddressLabeling } from '@suite-components';

const TruncatedSpan = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
`;

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
            type === 'sent' ? <AddressLabeling key={i} address={a} /> : <span key={i}>{a}</span>,
        )
    );
    return <TruncatedSpan>{addressLabel}</TruncatedSpan>;
};

export default TargetAddressLabel;
