import { useCallback } from 'react';

import { ConfirmUnverifiedModal } from './ConfirmUnverifiedModal';
import { openXpubModal, showXpub } from 'src/actions/wallet/publicKeyActions';

export const ConfirmUnverifiedXpubModal = () => {
    const event = useCallback(() => openXpubModal(), []);
    const verifyProcess = useCallback(() => showXpub(), []);

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
