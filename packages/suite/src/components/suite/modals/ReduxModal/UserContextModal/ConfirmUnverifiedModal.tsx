import { useEffect } from 'react';
import styled from 'styled-components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { Translation, Modal } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { ThunkAction } from 'src/types/suite';
import { Button, Image } from '@trezor/components';
import { onCancel } from 'src/actions/suite/modalActions';

const StyledImage = styled(Image)`
    align-self: center;
    padding: 20px 0px;
`;

const StyledModal = styled(Modal)`
    width: 520px;
`;

const StyledButton = styled(Button)`
    flex-grow: 1;
`;

interface ConfirmUnverifiedModalProps {
    showUnverifiedButtonText: TranslationKey;
    showUnverified: () => ThunkAction;
    verify: () => ThunkAction;
    warningText: TranslationKey;
}

export const ConfirmUnverifiedModal = ({
    showUnverifiedButtonText,
    showUnverified,
    verify,
    warningText,
}: ConfirmUnverifiedModalProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    // Device connected while the modal is open -> switch to verification modal.
    useEffect(() => {
        if (device?.connected) {
            dispatch(verify());
        }
    }, [device?.connected, dispatch, verify]);

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

    const enablePassphraseAndContinue = async () => {
        if (!device.available) {
            const result = await dispatch(applySettings({ use_passphrase: true }));
            if (!result || !result.success) return;
        }
        dispatch(verify());
    };
    const continueUnverified = () => dispatch(showUnverified());
    const close = () => dispatch(onCancel());

    return (
        <StyledModal
            heading={<Translation id={deviceStatus} values={{ deviceLabel: device.label }} />}
            isCancelable
            onCancel={close}
            description={
                <Translation
                    id={warningText}
                    values={{ claim: <Translation id={description} /> }}
                />
            }
            bottomBarComponents={
                <>
                    <Button variant="secondary" onClick={continueUnverified}>
                        <Translation id={showUnverifiedButtonText} />
                    </Button>
                    {isPassphraseRequired && (
                        <StyledButton
                            variant="primary"
                            onClick={enablePassphraseAndContinue}
                            isDisabled={isDeviceLocked}
                        >
                            <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
                        </StyledButton>
                    )}
                </>
            }
        >
            <StyledImage image="UNI_ERROR" />
        </StyledModal>
    );
};
