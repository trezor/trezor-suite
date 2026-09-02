import { useCallback } from 'react';

import { openXpubModal, showXpubThunk } from 'src/actions/wallet/publicKeyActions';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';

export const ConfirmUnverifiedXpubModal = () => {
    const event = useCallback(() => openXpubModal(), []);
    const verifyProcess = useCallback(() => showXpubThunk(), []);

    return (
        <ConfirmUnverifiedModal
            action={{
                event,
                title: 'TR_SHOW_UNVERIFIED_XPUB',
            }}
            verifyProcess={verifyProcess}
            warningText="TR_XPUB_PHISHING_WARNING"
        />
    );
};
