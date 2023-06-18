import React from 'react';
import styled from 'styled-components';
import { ArrayElement } from '@trezor/type-utils';
import { Translation, AddressLabeling } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';

const BlurWrapper = styled.span<{ isBlurred: boolean }>`
    filter: ${({ isBlurred }) => isBlurred && 'blur(2px)'};
`;

interface TokenTransferAddressLabelProps {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    type: WalletAccountTransaction['type'];
    isZeroValuePhishing: boolean;
}

export const TokenTransferAddressLabel = ({
    transfer,
    type,
    isZeroValuePhishing,
}: TokenTransferAddressLabelProps) => {
    if (type === 'self') {
        return <Translation id="TR_SENT_TO_SELF" />;
    }
    if (type === 'sent') {
        return <AddressLabeling address={transfer.to} />;
    }

    return <BlurWrapper isBlurred={isZeroValuePhishing}>{transfer.to}</BlurWrapper>;
};
