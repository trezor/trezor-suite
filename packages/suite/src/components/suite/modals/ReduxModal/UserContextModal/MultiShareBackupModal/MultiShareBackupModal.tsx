import { useState } from 'react';

import { selectDevice } from '@suite-common/wallet-core';
import { NewModal, NewModalProps } from '@trezor/components';
import {
    HELP_CENTER_KEEPING_SEED_SAFE_URL,
    TREZOR_SUPPORT_RECOVERY_ISSUES_URL,
    HELP_CENTER_UPGRADING_TO_MULTI_SHARE_URL,
} from '@trezor/urls';
import TrezorConnect, { PROTO } from '@trezor/connect';
import { EventType, analytics } from '@trezor/suite-analytics';
import { ConfirmOnDevice } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

import { MultiShareBackupStep1 } from './MultiShareBackupStep1';
import { MultiShareBackupStep2to4 } from './MultiShareBackupStep2to4';
import { MultiShareBackupStep5 } from './MultiShareBackupStep5';
import { isAdditionalShamirBackupInProgress } from '../../../../../../utils/device/isRecoveryInProgress';

const steps = ['first-info', 'second-info', 'verify-ownership', 'backup-seed', 'done'] as const;
export type Steps = (typeof steps)[number];

type MultiShareBackupModalProps = {
    onCancel: () => void;
};

type StepConfig = Partial<NewModalProps>;

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
            case 'first-info': {
                const goToStepNextStep = () => {
                    setIsSubmitted(true);
                    if (isChecked1 && isChecked2) {
                        setStep('second-info');
                    }
                };

                return {
                    size: 'small',
                    children: (
                        <MultiShareBackupStep1
                            isChecked1={isChecked1}
                            isChecked2={isChecked2}
                            isSubmitted={isSubmitted}
                            setIsChecked1={setIsChecked1}
                            setIsChecked2={setIsChecked2}
                        />
                    ),
                    bottomContent: (
                        <>
                            <NewModal.Button
                                onClick={goToStepNextStep}
                                data-testid="@multi-share-backup/1st-info/submit-button"
                                isDisabled={!isChecked1 || !isChecked2}
                            >
                                <Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />
                            </NewModal.Button>
                            <LearnMoreButton
                                url={HELP_CENTER_UPGRADING_TO_MULTI_SHARE_URL}
                                size="large"
                                onClick={learnMoreClicked}
                            />
                        </>
                    ),
                };
            }

            case 'second-info': {
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
                    children: <MultiShareBackupStep2to4 step={step} />,
                    bottomContent: (
                        <>
                            <NewModal.Button
                                onClick={enterBackup}
                                data-testid="@multi-share-backup/2nd-info/submit-button"
                            >
                                <Translation id="TR_ENTER_EXISTING_BACKUP" />
                            </NewModal.Button>
                            <LearnMoreButton url={TREZOR_SUPPORT_RECOVERY_ISSUES_URL} size="large">
                                <Translation id="TR_DONT_HAVE_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                    onBackClick: () => setStep('first-info'),
                };
            }

            case 'verify-ownership':
                return {
                    children: <MultiShareBackupStep2to4 step={step} />,
                    // There is a bug in FW, that prevents cancel during recovery-check
                    // https://github.com/trezor/trezor-firmware/issues/3503
                    onCancel: undefined,
                };

            case 'backup-seed':
                return {
                    children: <MultiShareBackupStep2to4 step={step} />,
                    onCancel: closeWithCancelOnDevice,
                };

            case 'done':
                return {
                    heading: <Translation id="TR_CREATE_MULTI_SHARE_BACKUP_CREATED" />,
                    children: <MultiShareBackupStep5 />,
                    bottomContent: (
                        <>
                            <NewModal.Button
                                onClick={handleCancel}
                                data-testid="@multi-share-backup/done/got-it-button"
                            >
                                <Translation id="TR_GOT_IT_BUTTON" />
                            </NewModal.Button>
                            <LearnMoreButton url={HELP_CENTER_KEEPING_SEED_SAFE_URL} size="medium">
                                <Translation id="TR_MULTI_SHARE_TIPS_ON_STORING_BACKUP" />
                            </LearnMoreButton>
                        </>
                    ),
                };
        }
    };

    const isDeviceStep = ['verify-ownership', 'backup-seed'].includes(step);

    return (
        <NewModal.Backdrop onClick={isDeviceStep ? undefined : handleCancel}>
            {isDeviceStep && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={device.features?.internal_model}
                    deviceUnitColor={device?.features?.unit_color}
                />
            )}
            <NewModal.ModalBase
                onCancel={handleCancel}
                heading={<Translation id="TR_CREATE_MULTI_SHARE_BACKUP" />}
                description={
                    <Translation
                        id="TR_STEP_OF_TOTAL"
                        values={{
                            index: steps.indexOf(step) + 1,
                            total: steps.length,
                        }}
                    />
                }
                {...getStepConfig()}
            />
        </NewModal.Backdrop>
    );
};
