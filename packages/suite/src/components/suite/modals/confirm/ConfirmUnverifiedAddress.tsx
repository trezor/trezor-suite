import React, { useCallback } from 'react';

import { ModalProps } from '@trezor/components';
import { openAddressModal, showAddress } from 'src/actions/wallet/receiveActions';
import { ConfirmUnverified } from './ConfirmUnverified';

interface ConfirmUnverifiedAddressProps extends Required<Pick<ModalProps, 'onCancel'>> {
    addressPath: string;
    value: string;
}

export const ConfirmUnverifiedAddress = ({ addressPath, value }: ConfirmUnverifiedAddressProps) => {
    const verifyAddress = useCallback(() => showAddress(addressPath, value), [addressPath, value]);
    const showUnverifiedAddress = () => openAddressModal({ addressPath, value });

    return (
        <ConfirmUnverified
            showUnverifiedButtonText="TR_SHOW_UNVERIFIED_ADDRESS"
            warningText="TR_ADDRESS_PHISHING_WARNING"
            verify={verifyAddress}
            showUnverified={showUnverifiedAddress}
        />
    );
};
