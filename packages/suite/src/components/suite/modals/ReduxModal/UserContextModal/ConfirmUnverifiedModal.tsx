import { useEffect } from 'react';

import { Translation, TranslationKey } from '@suite/intl';
import { onCancel } from '@suite/modal';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { ExtraDependencies } from '@suite-common/redux-utils';
import { H3, Modal, Paragraph, Tooltip } from '@trezor/components';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { Dispatch, GetState } from 'src/types/suite';

interface ConfirmUnverifiedModalProps {
    action: {
        event: () => (dispatch: Dispatch) => void;
        title: TranslationKey;
        closeAfterEventTriggered?: boolean;
    };
    verifyProcess?: () => (
        dispatch: Dispatch,
        getState: GetState,
        extra: ExtraDependencies,
    ) => Promise<void>;
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
        <Modal
            intent="warning"
            width={600}
            iconName="shieldWarning"
            onCancel={handleClose}
            bottomContent={
                <>
                    <Modal.Button intent="warning" onClick={handleEvent}>
                        <Translation id={action.title} />
                    </Modal.Button>
                    {isPassphraseRequired && (
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Modal.Button
                                intent="brand"
                                onClick={enablePassphraseAndContinue}
                                isDisabled={isDeviceLocked}
                            >
                                <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
                            </Modal.Button>
                        </Tooltip>
                    )}
                    <Modal.Button onClick={handleClose} intent="neutral" priority="secondary">
                        <Translation id="TR_DISMISS" />
                    </Modal.Button>
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
        </Modal>
    );
};
