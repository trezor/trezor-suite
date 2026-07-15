import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import {
    AdditionalBackupDisclaimer,
    AdditionalBackupSteps,
    AdditionalBackupSuccess,
} from '@suite/nfc';
import { isAdditionalShamirBackupInProgress } from '@suite/recovery';
import { selectIsN4w1BackupEnabled } from '@suite/settings';
import { selectSelectedDevice } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Modal } from '@trezor/components';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

type CreateWalletBackupModalProps = {
    onCancel: () => void;
};

type Step = 'disclaimer' | 'how-it-works' | 'verify-ownership' | 'backup' | 'done';

export const CreateWalletBackupModal = ({ onCancel }: CreateWalletBackupModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);

    const backupMethod = isN4w1BackupEnabled ? PROTO.BackupMethod.N4W1 : PROTO.BackupMethod.Display;

    const isInBackupMode =
        device?.features !== undefined && isAdditionalShamirBackupInProgress(device.features);

    const [step, setStep] = useState<Step>(isInBackupMode ? 'backup' : 'disclaimer');
    const [isChecked, setIsChecked] = useState(false);

    if (device === undefined) {
        return null;
    }

    const closeWithCancelOnDevice = () => {
        TrezorConnect.cancel('cancel');
        onCancel();
    };

    const startBackupFlow = async () => {
        setStep('verify-ownership');

        const verifyResult = await TrezorConnect.recoveryDevice({
            type: 'UnlockRepeatedBackup',
            input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
            enforce_wordlist: true,
            device: { path: device.path },
        });

        if (!verifyResult.success) {
            dispatch(notificationsActions.addToast({ type: 'backup-failed' }));
            onCancel();

            return;
        }

        setStep('backup');

        const backupResult = await TrezorConnect.backupDevice({
            backup_method: backupMethod,
            device: { path: device.path },
        });

        if (!backupResult.success) {
            dispatch(notificationsActions.addToast({ type: 'backup-failed' }));
            onCancel();

            return;
        }

        setStep('done');
    };

    const isDeviceStep = step === 'verify-ownership' || step === 'backup';

    const getContent = () => {
        switch (step) {
            case 'disclaimer':
                return {
                    heading: <Translation id="TR_CREATE_ADDITIONAL_BACKUP" />,
                    onCancel,
                    children: (
                        <AdditionalBackupDisclaimer
                            isChecked={isChecked}
                            setIsChecked={setIsChecked}
                        />
                    ),
                    bottomContent: (
                        <>
                            <Modal.Button
                                onClick={() => setStep('how-it-works')}
                                isDisabled={!isChecked}
                                data-testid="@additional-backup/disclaimer/continue-button"
                            >
                                <Translation id="TR_CONTINUE" />
                            </Modal.Button>
                            <LearnMoreButton
                                url={HELP_CENTER_MULTI_SHARE_BACKUP_URL}
                                size="large"
                            />
                        </>
                    ),
                };

            case 'how-it-works':
                return {
                    heading: <Translation id="TR_CREATE_ADDITIONAL_BACKUP" />,
                    onCancel,
                    description: (
                        <Translation id="TR_STEP_OF_TOTAL" values={{ index: 1, total: 2 }} />
                    ),
                    children: <AdditionalBackupSteps step="verify-ownership" />,
                    bottomContent: (
                        <>
                            <Modal.Button
                                onClick={startBackupFlow}
                                data-testid="@additional-backup/enter-backup-button"
                            >
                                <Translation id="TR_ENTER_EXISTING_BACKUP" />
                            </Modal.Button>
                            <LearnMoreButton url={HELP_CENTER_MULTI_SHARE_BACKUP_URL} size="large">
                                <Translation id="TR_DONT_HAVE_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                };

            case 'verify-ownership':
                return {
                    heading: <Translation id="TR_CREATE_ADDITIONAL_BACKUP" />,
                    onCancel: undefined,
                    description: (
                        <Translation id="TR_STEP_OF_TOTAL" values={{ index: 1, total: 2 }} />
                    ),
                    children: <AdditionalBackupSteps step="verify-ownership" />,
                };

            case 'backup':
                return {
                    heading: <Translation id="TR_CREATE_ADDITIONAL_BACKUP" />,
                    onCancel: closeWithCancelOnDevice,
                    description: (
                        <Translation id="TR_STEP_OF_TOTAL" values={{ index: 2, total: 2 }} />
                    ),
                    children: <AdditionalBackupSteps step="backup" />,
                };

            case 'done':
                return {
                    heading: undefined,
                    onCancel,
                    children: <AdditionalBackupSuccess />,
                    bottomContent: (
                        <Modal.Button
                            onClick={onCancel}
                            data-testid="@additional-backup/done/got-it-button"
                        >
                            <Translation id="TR_GOT_IT_BUTTON" />
                        </Modal.Button>
                    ),
                };
            default:
                return exhaustive(step);
        }
    };

    return (
        <Modal.Backdrop onClick={isDeviceStep ? undefined : onCancel}>
            {isDeviceStep && (
                <ConfirmOnDevicePill
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={device.features?.internal_model}
                    deviceUnitColor={device?.features?.unit_color}
                />
            )}
            <Modal.ModalBase {...getContent()} />
        </Modal.Backdrop>
    );
};
