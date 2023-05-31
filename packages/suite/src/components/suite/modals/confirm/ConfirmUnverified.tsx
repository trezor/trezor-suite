import React from 'react';
import styled from 'styled-components';

import { applySettings } from '@settings-actions/deviceSettingsActions';
import { Translation, Modal } from '@suite-components';
import { TranslationKey } from '@suite-components/Translation';
import { useDevice, useDispatch } from '@suite-hooks';
import { ThunkAction } from '@suite-types';
import { Button, Image, ModalProps } from '@trezor/components';

const StyledImage = styled(Image)`
    align-self: center;
    padding: 20px 0px;
`;

const StyledModal = styled(Modal)`
    width: 500px;
`;

const StyledButton = styled(Button)`
    flex-grow: 1;
`;

interface ConfirmUnverifiedProps extends Required<Pick<ModalProps, 'onCancel'>> {
    showUnverifiedButtonText: TranslationKey;
    showUnverified: () => ThunkAction;
    verify: () => ThunkAction;
    warningText: TranslationKey;
}

export const ConfirmUnverified = ({
    showUnverifiedButtonText,
    onCancel,
    showUnverified,
    verify,
    warningText,
}: ConfirmUnverifiedProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    // just to make TS happy
    if (!device) return null;

    const isDeviceLocked = isLocked();
    const isPassphraseRequired = device.connected && !device.available;
    const deviceStatus = isPassphraseRequired
        ? 'TR_DEVICE_LABEL_IS_UNAVAILABLE'
        : 'TR_DEVICE_LABEL_IS_NOT_CONNECTED';
    const description = isPassphraseRequired
        ? 'TR_PLEASE_ENABLE_PASSPHRASE'
        : 'TR_PLEASE_CONNECT_YOUR_DEVICE';
    const primaryButtonText = isPassphraseRequired
        ? 'TR_ACCOUNT_ENABLE_PASSPHRASE'
        : 'TR_TRY_VERIFYING_ON_DEVICE_AGAIN';

    const verifyAndContinue = async () => {
        if (!device.available) {
            const result = await dispatch(applySettings({ use_passphrase: true }));
            if (!result || !result.success) return;
        }
        onCancel();
        dispatch(verify());
    };
    const showUnverifiedAndContinue = () => {
        onCancel();
        dispatch(showUnverified());
    };

    return (
        <StyledModal
            heading={<Translation id={deviceStatus} values={{ deviceLabel: device.label }} />}
            isCancelable
            onCancel={onCancel}
            description={
                <Translation
                    id={warningText}
                    values={{ claim: <Translation id={description} /> }}
                />
            }
            bottomBar={
                <>
                    <Button variant="secondary" onClick={showUnverifiedAndContinue}>
                        <Translation id={showUnverifiedButtonText} />
                    </Button>
                    <StyledButton
                        variant="primary"
                        onClick={verifyAndContinue}
                        isDisabled={isDeviceLocked}
                    >
                        <Translation id={primaryButtonText} />
                    </StyledButton>
                </>
            }
        >
            <StyledImage image="UNI_ERROR" />
        </StyledModal>
    );
};
