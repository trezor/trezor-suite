import { useState } from 'react';

import { acquireDevice } from '@suite-common/wallet-core';
import { Button, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from '../../../../../hooks/suite';
import { Translation } from '../../../Translation';

export const ThpPairingFailedModal = ({ onCancel }: { onCancel: () => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const handleRetry = () => {
        setIsLoading(true);
        // Re-try in user context is simply acquiring the device again which triggers the THP flow
        dispatch(acquireDevice());
    };

    return (
        <Modal
            data-testid="@modal/thp-paring-failed"
            bottomContent={
                <>
                    <Button onClick={handleRetry} isLoading={isLoading}>
                        <Translation id="TR_TRY_AGAIN" />
                    </Button>
                    <Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </Button>
                </>
            }
            iconName="warning"
            variant="warning"
        >
            <Column gap={spacings.xs}>
                <Text typographyStyle="titleMedium">
                    <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                </Text>
                <Text variant="tertiary" typographyStyle="highlight">
                    <Translation id="TR_THP_VERIFICATION_FAILED_DESCRIPTION" />
                </Text>
            </Column>
        </Modal>
    );
};
