import { useState } from 'react';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { MODAL_CONTEXT_DEVICE, selectModalRequestId } from '@suite/modal';
import {
    type RecoveryType,
    type SeedInputStatus,
    type WordCount,
    checkSeedThunk,
    isStandardRecoveryDisabled,
    recoveryActions,
    selectRecovery,
} from '@suite/recovery';
import { usePin } from '@suite-common/device';
import { isDeviceAcquired } from '@suite-common/suite-utils';
import { Box, H2, Image, Modal, Paragraph } from '@trezor/components';
import TrezorConnect, { UI_REQUEST } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Loading, PinMatrix, WordInputAdvanced } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import type { ForegroundAppProps } from 'src/types/suite';

import { EnterOnDeviceStep } from './steps/EnterOnDeviceStep';
import { InitialStep } from './steps/InitialStep';
import { RequestConfirmationStep } from './steps/RequestConfirmationStep';
import { SelectRecoveryTypeStep } from './steps/SelectRecoveryTypeStep';
import { SelectWordCountStep } from './steps/SelectWordCountStep';
import { WordInputStep } from './steps/WordInputStep';

export const Recovery = ({ onCancel }: ForegroundAppProps) => {
    const recovery = useSelector(selectRecovery);
    const modal = useSelector(state => state.modal);
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const [isUnderstood, setIsUnderstood] = useState(false);
    const [wordCount, setWordCount] = useState<WordCount | undefined>();
    const [recoveryType, setRecoveryType] = useState<RecoveryType | undefined>();
    const intl = useIntl();
    const pinRequestId = useSelector(selectModalRequestId);
    const { pin, setPin, handlePinSubmit } = usePin(device?.buttonRequests ?? [], pinRequestId);

    const deviceModelInternal = device?.features?.internal_model;
    const isT1B1 = deviceModelInternal === DeviceModelInternal.T1B1;
    const statesInProgressBar: SeedInputStatus[] = isT1B1
        ? [
              'initial',
              'select-word-count',
              'select-recovery-type',
              'waiting-for-confirmation',
              'in-progress',
          ]
        : ['initial', 'in-progress'];
    const hasFinished = recovery.status === 'finished';
    const hasError = recovery.error !== undefined;
    const hasBackClick = ['select-word-count', 'select-recovery-type'].includes(recovery.status);

    const handleClose = () => {
        if (['in-progress', 'waiting-for-confirmation'].includes(recovery.status)) {
            TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        } else {
            onCancel();
        }
    };

    const handleBackClick = () => {
        dispatch(
            recoveryActions.setStatus(
                statesInProgressBar[statesInProgressBar.indexOf(recovery.status) - 1],
            ),
        );
    };

    if (!isDeviceAcquired(device) || !deviceModelInternal) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={onCancel}
                data-testid="@recovery/no-device"
                width={400}
            >
                <Image image="CONNECT_DEVICE" />
            </Modal>
        );
    }

    const getStep = () => {
        switch (recovery.status) {
            case 'initial':
                return (
                    <InitialStep isUnderstood={isUnderstood} setIsUnderstood={setIsUnderstood} />
                );
            case 'select-word-count':
                return <SelectWordCountStep setWordCount={setWordCount} wordCount={wordCount} />;
            case 'select-recovery-type':
                return (
                    <SelectRecoveryTypeStep
                        setRecoveryType={setRecoveryType}
                        recoveryType={recoveryType}
                    />
                );
            case 'waiting-for-confirmation':
            case 'in-progress':
                // When T1B1 requests PIN confirmation, the status is still 'waiting-for-confirmation'
                // so we need to check the modal context to know if we should show the loading indicator
                if (modal.context !== MODAL_CONTEXT_DEVICE) {
                    return (
                        <Box padding={spacings.xxl}>
                            <Loading />
                        </Box>
                    );
                }

                // Do not rely on Capability_PassphraseEntry feature. For ancient firmwares it's not there,
                // and we want to allow devices that have unsupported FW to be able to check the seed.
                if (isT1B1) {
                    switch (modal.windowType) {
                        case UI_REQUEST.REQUEST_PIN:
                            return (
                                <PinMatrix
                                    pin={pin}
                                    setPin={setPin}
                                    onSubmit={handlePinSubmit}
                                    showLabel
                                />
                            );
                        case 'ButtonRequest_Other':
                            return <RequestConfirmationStep />;
                        case 'WordRequestType_Plain':
                            return <WordInputStep />;
                        case 'WordRequestType_Matrix6':
                            return <WordInputAdvanced count={6} />;
                        case 'WordRequestType_Matrix9':
                            return <WordInputAdvanced count={9} />;
                    }
                }

                return <EnterOnDeviceStep deviceModelInternal={deviceModelInternal} />;
            case 'finished':
                return !hasError ? (
                    <>
                        <H2 data-testid="@recovery/success-title">
                            <Translation id="TR_SEED_CHECK_SUCCESS_TITLE" />
                        </H2>
                        <Paragraph
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            margin={{ top: spacings.xs }}
                        >
                            <Translation id="TR_SEED_CHECK_SUCCESS_DESC" />
                        </Paragraph>
                    </>
                ) : (
                    <>
                        <H2>
                            <Translation id="TR_SEED_CHECK_FAIL_TITLE" />
                        </H2>
                        <Paragraph
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            margin={{ top: spacings.xs }}
                        >
                            <Translation
                                id="TR_RECOVERY_ERROR"
                                values={{ error: recovery.error }}
                            />
                        </Paragraph>
                    </>
                );
        }
    };

    const getBottomContentPrimaryButton = () => {
        switch (recovery.status) {
            case 'initial':
                return (
                    <Modal.Button
                        onClick={() =>
                            isT1B1
                                ? dispatch(recoveryActions.setStatus('select-word-count'))
                                : dispatch(checkSeedThunk())
                        }
                        isDisabled={!isUnderstood || isLocked()}
                        data-testid="@recovery/start-button"
                    >
                        <Translation id="TR_START" />
                    </Modal.Button>
                );
            case 'select-word-count':
                return (
                    <Modal.Button
                        isDisabled={!wordCount}
                        onClick={() => {
                            if (!wordCount) return;

                            dispatch(recoveryActions.setWordsCount(wordCount));

                            // For T1B1 with 12 or 18 words, skip recovery type selection and use Advanced recovery
                            // For 24 words, show the recovery type selection
                            const shouldSkipSelection = isStandardRecoveryDisabled(
                                deviceModelInternal,
                                wordCount,
                                'standard',
                            );

                            if (shouldSkipSelection) {
                                dispatch(recoveryActions.setAdvancedRecovery(true));
                                dispatch(checkSeedThunk());
                            } else {
                                dispatch(recoveryActions.setStatus('select-recovery-type'));
                            }
                        }}
                        data-testid="@recovery/continue-button"
                    >
                        <Translation id="TR_CONTINUE" />
                    </Modal.Button>
                );
            case 'select-recovery-type':
                return (
                    <Modal.Button
                        isDisabled={!recoveryType}
                        onClick={() => {
                            dispatch(
                                recoveryActions.setAdvancedRecovery(recoveryType === 'advanced'),
                            );
                            dispatch(checkSeedThunk());
                        }}
                        data-testid="@recovery/continue-button"
                    >
                        <Translation id="TR_CONTINUE" />
                    </Modal.Button>
                );
            case 'waiting-for-confirmation':
                if (
                    isT1B1 &&
                    modal.context === MODAL_CONTEXT_DEVICE &&
                    modal.windowType === UI_REQUEST.REQUEST_PIN
                ) {
                    return (
                        <Modal.Button onClick={handlePinSubmit} data-testid="@pin/submit-button">
                            <Translation id="TR_CONFIRM" />
                        </Modal.Button>
                    );
                }
        }
    };

    const getIconName = () => {
        if (recovery.status === 'finished') {
            return hasError ? 'warning' : 'check';
        }

        return undefined;
    };

    const getIntent = () => {
        if (recovery.status === 'in-progress') {
            return 'info';
        }

        return hasError ? 'warning' : 'brand';
    };

    const getWidth = () => {
        switch (recovery.status) {
            case 'initial':
                return 680;
            case 'waiting-for-confirmation':
                return 400;
            case 'in-progress':
                return isT1B1 ? 400 : 600;
            default:
                return 600;
        }
    };

    return (
        <Modal.Backdrop>
            {['in-progress', 'waiting-for-confirmation'].includes(recovery.status) && (
                <ConfirmOnDevicePill
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={device.features.internal_model}
                    deviceUnitColor={device.features.unit_color}
                    onCancel={handleClose}
                />
            )}
            <Modal.ModalBase
                heading={hasError ? undefined : <Translation id="TR_CHECK_RECOVERY_SEED" />}
                description={
                    statesInProgressBar.includes(recovery.status) ? (
                        <Translation
                            id="TR_STEP_OF_TOTAL"
                            values={{
                                index: statesInProgressBar.indexOf(recovery.status) + 1,
                                total: statesInProgressBar.length,
                            }}
                        />
                    ) : undefined
                }
                bottomContent={
                    <>
                        {getBottomContentPrimaryButton()}
                        {hasFinished && (
                            <Modal.Button priority="primary" onClick={handleClose}>
                                <Translation id="TR_CLOSE" />
                            </Modal.Button>
                        )}
                    </>
                }
                onBackClick={hasBackClick ? handleBackClick : undefined}
                onCancel={handleClose}
                intent={getIntent()}
                iconName={getIconName()}
                width={getWidth()}
            >
                {getStep()}
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
