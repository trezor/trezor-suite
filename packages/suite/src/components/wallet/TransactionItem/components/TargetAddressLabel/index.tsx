import React from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from '@wallet-types';
import { ArrayElement } from '@trezor/type-utils';
import { Translation, AddressLabeling } from '@suite-components';
import { AccountMetadata } from '@suite-types/metadata';

const TruncatedSpan = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
`;

interface Props {
    target: ArrayElement<WalletAccountTransaction['targets']>;
    type: WalletAccountTransaction['type'];
    accountMetadata?: AccountMetadata;
}
const TargetAddressLabel = ({ target, type, accountMetadata }: Props) => {
    const isLocalTarget = (type === 'sent' || type === 'self') && target.isAccountTarget;

    if (isLocalTarget) {
        return (
            <TruncatedSpan>
                <Translation id="TR_SENT_TO_SELF" />
            </TruncatedSpan>
        );
    }

    return (
        <TruncatedSpan>
            {target.addresses?.map((a, i) =>
                // either it may be AddressLabeling - sent to another account associated with this device, e.g: "Bitcoin #2"
                // or it may show address metadata label added from receive tab e.g "My address for illegal things"
                type === 'sent' ? (
                    // Using index as a key is safe as the array doesn't change (no filter/reordering, pushing new items)
                    // eslint-disable-next-line react/no-array-index-key
                    <AddressLabeling key={i} address={a} />
                ) : (
                    // eslint-disable-next-line react/no-array-index-key
                    <span key={i}>{accountMetadata?.addressLabels[a] || a}</span>
                ),
            )}
        </TruncatedSpan>
    );
};

export default TargetAddressLabel;
