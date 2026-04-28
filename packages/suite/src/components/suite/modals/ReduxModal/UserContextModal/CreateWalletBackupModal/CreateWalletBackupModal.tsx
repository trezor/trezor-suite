import { useState } from 'react';

import { createAdditionalBackupThunk } from '@suite/backup';
import { Translation } from '@suite/intl';
import {
    AdditionalBackupDisclaimer,
    AdditionalBackupSteps,
    AdditionalBackupSuccess,
} from '@suite/nfc';
import { isAdditionalShamirBackupInProgress } from '@suite/recovery';
import { selectSelectedDevice } from '@suite-common/device';
import { Modal } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDispatch, useSelector } from 'src/hooks/suite';

type CreateWalletBackupModalProps = {
    onCancel: () => void;
};

type Step = 'disclaimer' | 'how-it-works' | 'verify-ownership' | 'backup' | 'done';

const getStepIndex = (step: Step) => {
    if (step === 'disclaimer') return 0;

    // Steps shown on the "Step X of 2" counter
    if (step === 'how-it-works' || step === 'verify-ownership') return 1;

    return 2;
};

export const CreateWalletBackupModal = ({ onCancel }: CreateWalletBackupModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

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

    const startVerification = async () => {
        setStep('verify-ownership');

        const result = await dispatch(
            createAdditionalBackupThunk({
                devicePath: device.path,
                onVerificationComplete: () => setStep('backup'),
            }),
        ).unwrap();

        if (result.success) {
            setStep('done');
        } else {
            onCancel();
        }
    };

    const isDeviceStep = step === 'verify-ownership' || step === 'backup';
    const stepIndex = getStepIndex(step);

    const getStepConfig = () => {
        switch (step) {
            case 'disclaimer':
                return {
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
                    description: (
                        <Translation
                            id="TR_STEP_OF_TOTAL"
                            values={{ index: stepIndex, total: 2 }}
                        />
                    ),
                    children: <AdditionalBackupSteps step="verify-ownership" />,
                    bottomContent: (
                        <>
                            <Modal.Button
                                onClick={startVerification}
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
                    description: (
                        <Translation
                            id="TR_STEP_OF_TOTAL"
                            values={{ index: stepIndex, total: 2 }}
                        />
                    ),
                    children: <AdditionalBackupSteps step="verify-ownership" />,
                    onCancel: undefined,
                };

            case 'backup':
                return {
                    description: (
                        <Translation
                            id="TR_STEP_OF_TOTAL"
                            values={{ index: stepIndex, total: 2 }}
                        />
                    ),
                    children: <AdditionalBackupSteps step="backup" />,
                    onCancel: closeWithCancelOnDevice,
                };

            case 'done':
                return {
                    heading: undefined,
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
                return step satisfies never;
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
            <Modal.ModalBase
                onCancel={onCancel}
                heading={
                    step !== 'done' ? <Translation id="TR_CREATE_ADDITIONAL_BACKUP" /> : undefined
                }
                {...getStepConfig()}
            />
        </Modal.Backdrop>
    );
};
