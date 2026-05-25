import { useCallback } from 'react';

import { openAddressModal, showAddressThunk } from '@suite/receive';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';

interface ConfirmUnverifiedAddressModalProps {
    addressPath: string;
    value: string;
}

export const ConfirmUnverifiedAddressModal = ({
    addressPath,
    value,
}: ConfirmUnverifiedAddressModalProps) => {
    const verifyProcess = useCallback(
        () => showAddressThunk({ path: addressPath, address: value }),
        [addressPath, value],
    );
    const showUnverifiedAddress = () => openAddressModal({ addressPath, value });

    return (
        <ConfirmUnverifiedModal
            action={{
                event: showUnverifiedAddress,
                title: 'TR_SHOW_UNVERIFIED_ADDRESS',
            }}
            verifyProcess={verifyProcess}
            warningText="TR_ADDRESS_PHISHING_WARNING"
        />
    );
};
