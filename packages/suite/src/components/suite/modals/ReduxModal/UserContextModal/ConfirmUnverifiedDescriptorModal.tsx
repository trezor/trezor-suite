import { useCallback } from 'react';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';
import { openDescriptorBip380Modal, showDescriptor } from 'src/actions/wallet/descriptorActions';

export const ConfirmUnverifiedDescriptorModal = () => {
    console.log('ConfirmUnverifiedDescriptorModal');
    const event = useCallback(() => openDescriptorBip380Modal(), []);
    const verifyProcess = useCallback(() => showDescriptor(), []);

    return (
        <ConfirmUnverifiedModal
            action={{
                event,
                title: 'TR_SHOW_UNVERIFIED_DESCRIPTOR',
            }}
            verifyProcess={verifyProcess}
            warningText="TR_DESCRIPTOR_PHISHING_WARNING"
        />
    );
};
