import { useState } from 'react';
import { selectDevice } from '@suite-common/wallet-core';

import { Button, ModalProps } from '@trezor/components';
import {
    HELP_CENTER_KEEPING_SEED_SAFE_URL,
    TREZOR_SUPPORT_RECOVERY_ISSUES_URL,
    HELP_CENTER_UPGRADING_TO_MULTI_SHARE_URL,
} from '@trezor/urls';

import { useSelector } from 'src/hooks/suite';
import { Modal, Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { MultiShareBackupStep1FirstInfo } from './MultiShareBackupStep1FirstInfo';
import { MultiShareBackupStep2SecondInfo } from './MultiShareBackupStep2SecondInfo';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { MultiShareBackupStep5Done } from './MultiShareBackupStep5Done';
import { isAdditionalShamirBackupInProgress } from '../../../../../../utils/device/isRecoveryInProgress';
import { MultiShareBackupStep3VerifyOwnership } from './MultiShareBackupStep3VerifyOwnership';
import { MultiShareBackupStep4BackupSeed } from './MultiShareBackupStep4BackupSeed';
import { EventType, analytics } from '@trezor/suite-analytics';

type Steps = 'first-info' | 'second-info' | 'verify-ownership' | 'backup-seed' | 'done';

type MultiShareBackupModalProps = {
    onCancel: () => void;
};

type StepConfig = Partial<ModalProps> &
    Required<Pick<ModalProps, 'isCancelable' | 'heading' | 'children' | 'hasBackdropCancel'>>;

export const MultiShareBackupModal = ({ onCancel }: MultiShareBackupModalProps) => {
    const device = useSelector(selectDevice);

    const isInBackupMode =
        device?.features !== undefined && isAdditionalShamirBackupInProgress(device.features);

    const [step, setStep] = useState<Steps>(isInBackupMode ? 'backup-seed' : 'first-info');

    const [isChecked1, setIsChecked1] = useState(false);
    const [isChecked2, setIsChecked2] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const learnMoreClicked = () => {
        analytics.report({
            type: EventType.SettingsMultiShareBackup,
            payload: { action: 'learn-more' },
        });
    };

    const handleCancel = () => {
        if (step !== 'done') {
            analytics.report({
                type: EventType.SettingsMultiShareBackup,
                payload: { action: 'close-modal' },
            });
        }

        onCancel();
    };

    const closeWithCancelOnDevice = () => {
        TrezorConnect.cancel('cancel');
        handleCancel();
    };

    if (device === undefined) {
        return;
    }

    const getStepConfig = (): StepConfig => {
        switch (step) {
            case 'first-info':
                const goToStepNextStep = () => {
                    setIsSubmitted(true);
                    if (isChecked1 && isChecked2) {
                        setStep('second-info');
                    }
                };

                return {
                    heading: <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />,
                    children: (
                        <MultiShareBackupStep1FirstInfo
                            isChecked1={isChecked1}
                            isChecked2={isChecked2}
                            isSubmitted={isSubmitted}
                            setIsChecked1={setIsChecked1}
                            setIsChecked2={setIsChecked2}
                        />
                    ),
                    bottomBarComponents: (
                        <>
                            <Button
                                onClick={goToStepNextStep}
                                data-testid="@multi-share-backup/1st-info/submit-button"
                            >
                                <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                            </Button>
                            <LearnMoreButton
                                url={HELP_CENTER_UPGRADING_TO_MULTI_SHARE_URL}
                                size="medium"
                                onClick={learnMoreClicked}
                            />
                        </>
                    ),
                    isCancelable: true,
                    hasBackdropCancel: true,
                };

            case 'second-info':
                const enterBackup = async () => {
                    setStep('verify-ownership');

                    const response = await TrezorConnect.recoveryDevice({
                        type: 'UnlockRepeatedBackup',
                        input_method: PROTO.RecoveryDeviceInputMethod.Matrix,
                        enforce_wordlist: true,
                        device: {
                            path: device.path,
                        },
                    });

                    if (response.success) {
                        setStep('backup-seed');
                        TrezorConnect.backupDevice().then(response => {
                            if (response.success) {
                                analytics.report({
                                    type: EventType.SettingsMultiShareBackup,
                                    payload: { action: 'done' },
                                });

                                setStep('done');
                            } else {
                                handleCancel();
                            }
                        });
                    } else {
                        handleCancel();
                    }
                };

                return {
                    heading: <Translation id="TR_NEXT_UP" />,
                    children: <MultiShareBackupStep2SecondInfo />,
                    bottomBarComponents: (
                        <>
                            <Button
                                onClick={enterBackup}
                                data-testid="@multi-share-backup/2nd-info/submit-button"
                            >
                                <Translation id="TR_ENTER_EXISTING_BACKUP" />
                            </Button>
                            <LearnMoreButton url={TREZOR_SUPPORT_RECOVERY_ISSUES_URL} size="medium">
                                <Translation id="TR_DONT_HAVE_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                    onBackClick: () => setStep('first-info'),
                    isCancelable: true,
                    hasBackdropCancel: true,
                };

            case 'verify-ownership':
                return {
                    children: <MultiShareBackupStep3VerifyOwnership />,
                    heading: <Translation id="TR_CONFIRM_ON_TREZOR" />,
                    onCancel: closeWithCancelOnDevice,
                    isCancelable: false, // There is a bug in FW, that prevents cancel during recovery-check
                    hasBackdropCancel: false,
                };

            case 'backup-seed':
                return {
                    children: <MultiShareBackupStep4BackupSeed />,
                    heading: <Translation id="TR_CONFIRM_ON_TREZOR" />,
                    onCancel: closeWithCancelOnDevice,
                    isCancelable: true,
                    hasBackdropCancel: false, // It is hard to get here, we don't want to cancel it by miss-click
                };

            case 'done':
                return {
                    heading: <Translation id="TR_CREATE_MULTI_SHARE_BACKUP_CREATED" />,
                    children: <MultiShareBackupStep5Done />,
                    bottomBarComponents: (
                        <>
                            <Button
                                onClick={handleCancel}
                                data-testid="@multi-share-backup/done/got-it-button"
                            >
                                <Translation id="TR_GOT_IT_BUTTON" />
                            </Button>
                            <LearnMoreButton url={HELP_CENTER_KEEPING_SEED_SAFE_URL} size="medium">
                                <Translation id="TR_MULTI_SHARE_TIPS_ON_STORING_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                    isCancelable: true,
                    hasBackdropCancel: true,
                };
        }
    };

    return <Modal onCancel={handleCancel} {...getStepConfig()}></Modal>;
};
