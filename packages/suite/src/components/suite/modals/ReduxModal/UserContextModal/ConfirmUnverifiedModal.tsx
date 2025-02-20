import { useEffect } from 'react';

import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Button, H3, NewModal, Paragraph, Tooltip } from '@trezor/components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { onCancel } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { Dispatch, GetState } from 'src/types/suite';

interface ConfirmUnverifiedModalProps {
    action: {
        event: () => (dispatch: Dispatch) => void;
        title: TranslationKey;
        closeAfterEventTriggered?: boolean;
    };
    verifyProcess?: () => (dispatch: Dispatch, getState: GetState) => Promise<void>;
    warningText: TranslationKey;
}

export const ConfirmUnverifiedModal = ({
    action,
    warningText,
    verifyProcess,
}: ConfirmUnverifiedModalProps) => {
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const { device } = useDevice();
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const isPassphraseRequired = device?.connected && !device.available;
    const deviceStatus = isPassphraseRequired
        ? 'TR_DEVICE_LABEL_IS_UNAVAILABLE'
        : 'TR_DEVICE_LABEL_IS_NOT_CONNECTED';
    const description = isPassphraseRequired
        ? 'TR_PLEASE_ENABLE_PASSPHRASE'
        : 'TR_PLEASE_CONNECT_YOUR_DEVICE';

    const handleClose = () => dispatch(onCancel());
    const handleEvent = () => {
        dispatch(action.event());

        if (action.closeAfterEventTriggered) {
            handleClose();
        }
    };

    const enablePassphraseAndContinue = async () => {
        if (!device?.available) {
            const result = await dispatch(applySettings({ use_passphrase: true }));
            if (!result || !result.success) return;
        }
    };

    // Device connected while the modal is open -> switch to verification modal.
    useEffect(() => {
        if (device?.connected && verifyProcess) {
            dispatch(verifyProcess());
        }
    }, [device?.connected, dispatch, verifyProcess]);

    return (
        <NewModal
            variant="warning"
            size="small"
            iconName="shieldWarning"
            onCancel={handleClose}
            bottomContent={
                <>
                    <Button variant="warning" onClick={handleEvent}>
                        <Translation id={action.title} />
                    </Button>
                    {isPassphraseRequired && (
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Button
                                variant="primary"
                                onClick={enablePassphraseAndContinue}
                                isDisabled={isDeviceLocked}
                            >
                                <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
                            </Button>
                        </Tooltip>
                    )}
                    <Button onClick={handleClose} variant="tertiary">
                        <Translation id="TR_DISMISS" />
                    </Button>
                </>
            }
        >
            <H3>
                <Translation id={deviceStatus} values={{ deviceLabel }} />
            </H3>
            <Paragraph>
                <Translation
                    id={warningText}
                    values={{ claim: <Translation id={description} /> }}
                />
            </Paragraph>
        </NewModal>
    );
};
