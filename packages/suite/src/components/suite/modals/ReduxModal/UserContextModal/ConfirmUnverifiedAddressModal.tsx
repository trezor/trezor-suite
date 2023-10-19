import React, { useCallback } from 'react';

import { ModalProps } from '@trezor/components';
import { openAddressModal, showAddress } from 'src/actions/wallet/receiveActions';
import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';

interface ConfirmUnverifiedAddressModalProps extends Required<Pick<ModalProps, 'onCancel'>> {
    addressPath: string;
    value: string;
}

export const ConfirmUnverifiedAddressModal = ({
    addressPath,
    value,
}: ConfirmUnverifiedAddressModalProps) => {
    const verifyAddress = useCallback(() => showAddress(addressPath, value), [addressPath, value]);
    const showUnverifiedAddress = () => openAddressModal({ addressPath, value });

    return (
        <ConfirmUnverifiedModal
            showUnverifiedButtonText="TR_SHOW_UNVERIFIED_ADDRESS"
            warningText="TR_ADDRESS_PHISHING_WARNING"
            verify={verifyAddress}
            showUnverified={showUnverifiedAddress}
        />
    );
};
