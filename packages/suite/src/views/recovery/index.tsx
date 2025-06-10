import { useState } from 'react';
import { useIntl } from 'react-intl';

import { isDeviceAcquired } from '@suite-common/suite-utils';
import { usePin } from '@suite-common/wallet-core';
import { Box, H2, Image, Modal, Paragraph } from '@trezor/components';
import TrezorConnect, { UI } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { ConfirmOnDevice } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import {
    SeedInputStatus,
    checkSeed,
    setAdvancedRecovery,
    setStatus,
    setWordsCount,
} from 'src/actions/recovery/recoveryActions';
import { MODAL } from 'src/actions/suite/constants';
import { Loading, PinMatrix, Translation, WordInputAdvanced } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';
import type { RecoveryType, WordCount } from 'src/types/recovery';
import type { ForegroundAppProps } from 'src/types/suite';

import { EnterOnDeviceStep } from './steps/EnterOnDeviceStep';
import { InitialStep } from './steps/InitialStep';
import { RequestConfirmationStep } from './steps/RequestConfirmationStep';
import { SelectRecoveryTypeStep } from './steps/SelectRecoveryTypeStep';
import { SelectWordCountStep } from './steps/SelectWordCountStep';
import { WordInputStep } from './steps/WordInputStep';

export const Recovery = ({ onCancel }: ForegroundAppProps) => {
    const recovery = useSelector(state => state.recovery);
    const modal = useSelector(state => state.modal);
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const [isUnderstood, setIsUnderstood] = useState(false);
    const [wordCount, setWordCount] = useState<WordCount | undefined>();
    const [recoveryType, setRecoveryType] = useState<RecoveryType | undefined>();
    const intl = useIntl();
    const { pin, setPin, handlePinSubmit } = usePin(device?.buttonRequests ?? []);

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
        dispatch(setStatus(statesInProgressBar[statesInProgressBar.indexOf(recovery.status) - 1]));
    };

    if (!isDeviceAcquired(device) || !deviceModelInternal) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={onCancel}
                data-testid="@recovery/no-device"
                size="tiny"
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
                if (modal.context !== MODAL.CONTEXT_DEVICE) {
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
                        case UI.REQUEST_PIN:
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
                            typographyStyle="hint"
                            variant="tertiary"
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
                            typographyStyle="hint"
                            variant="tertiary"
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
                                ? dispatch(setStatus('select-word-count'))
                                : dispatch(checkSeed())
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

                            dispatch(setWordsCount(wordCount));
                            dispatch(setStatus('select-recovery-type'));
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
                            dispatch(setAdvancedRecovery(recoveryType === 'advanced'));
                            dispatch(checkSeed());
                        }}
                        data-testid="@recovery/continue-button"
                    >
                        <Translation id="TR_CONTINUE" />
                    </Modal.Button>
                );
            case 'waiting-for-confirmation':
                if (
                    isT1B1 &&
                    modal.context === MODAL.CONTEXT_DEVICE &&
                    modal.windowType === UI.REQUEST_PIN
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

    const getVariant = () => {
        if (recovery.status === 'in-progress') {
            return 'info';
        }

        return hasError ? 'warning' : 'primary';
    };

    const getSize = () => {
        switch (recovery.status) {
            case 'initial':
                return 'medium';
            case 'waiting-for-confirmation':
                return 'tiny';
            case 'in-progress':
                return isT1B1 ? 'tiny' : 'small';
            default:
                return 'small';
        }
    };

    return (
        <Modal.Backdrop>
            {['in-progress', 'waiting-for-confirmation'].includes(recovery.status) && (
                <ConfirmOnDevice
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
                        <Modal.Button
                            variant={hasFinished ? undefined : 'tertiary'}
                            onClick={handleClose}
                        >
                            <Translation id={hasFinished ? 'TR_CLOSE' : 'TR_CANCEL'} />
                        </Modal.Button>
                    </>
                }
                onBackClick={hasBackClick ? handleBackClick : undefined}
                onCancel={handleClose}
                variant={getVariant()}
                iconName={getIconName()}
                size={getSize()}
            >
                {getStep()}
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
