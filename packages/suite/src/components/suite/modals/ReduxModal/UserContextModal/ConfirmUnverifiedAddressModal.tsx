import { useCallback } from 'react';

import { openAddressModal, showAddressThunk } from '@suite/receive';
import { type AccountKey } from '@suite-common/wallet-types';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';

interface ConfirmUnverifiedAddressModalProps {
    accountKey: AccountKey;
    addressPath: string;
    value: string;
}

export const ConfirmUnverifiedAddressModal = ({
    accountKey,
    addressPath,
    value,
}: ConfirmUnverifiedAddressModalProps) => {
    const verifyProcess = useCallback(
        () => showAddressThunk({ path: addressPath, address: value }),
        [addressPath, value],
    );
    const showAddress = () => openAddressModal({ accountKey, addressPath, value });

    return (
        <ConfirmUnverifiedModal
            action={{
                event: showAddress,
                title: 'TR_SHOW_UNVERIFIED_ADDRESS',
            }}
            verifyProcess={verifyProcess}
            warningText="TR_ADDRESS_PHISHING_WARNING"
        />
    );
};
