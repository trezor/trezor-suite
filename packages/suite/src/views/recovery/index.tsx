import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { getCheckBackupUrl } from '@suite-common/suite-utils';
import { Button, H2, Paragraph, Image } from '@trezor/components';
import { pickByDeviceModel } from '@trezor/device-utils';
import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';

import { SelectWordCount, SelectRecoveryType } from 'src/components/recovery';
import { Loading, Translation, CheckItem, Modal } from 'src/components/suite';
import { ReduxModal } from 'src/components/suite/modals/ReduxModal/ReduxModal';
import {
    checkSeed,
    setAdvancedRecovery,
    setStatus,
    setWordsCount,
} from 'src/actions/recovery/recoveryActions';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import type { ForegroundAppProps } from 'src/types/suite';
import type { WordCount } from 'src/types/recovery';
import { InstructionStep } from 'src/components/suite/InstructionStep';
import messages from 'src/support/messages';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

const StyledModal = styled(Modal)`
    min-height: 450px;

    ${Modal.Content} {
        justify-content: center;
    }
`;

const StyledButton = styled(Button)`
    width: 224px;
`;

const StepsContainer = styled.div`
    margin: 40px 0;
`;

const StyledP = styled(Paragraph)`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(Image)`
    margin-bottom: 24px;
    align-self: center;
`;

const LeftAlignedP = styled(StyledP)`
    text-align: left;
`;

const StatusImage = styled(Image)`
    padding-bottom: 24px;
`;

const StatusTitle = styled(H2)`
    margin: 0 0 12px;
`;

const VerticalCenter = styled.div`
    margin-top: auto;
    margin-bottom: auto;
`;

export const Recovery = ({ onCancel }: ForegroundAppProps) => {
    const recovery = useSelector(state => state.recovery);
    const modal = useSelector(state => state.modal);
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const [understood, setUnderstood] = useState(false);

    const intl = useIntl();

    const onSetWordsCount = (count: WordCount) => {
        dispatch(setWordsCount(count));
        dispatch(setStatus('select-recovery-type'));
    };

    const onSetRecoveryType = (type: 'standard' | 'advanced') => {
        dispatch(setAdvancedRecovery(type === 'advanced'));
        dispatch(checkSeed());
    };

    const deviceModelInternal = device?.features?.internal_model;
    const learnMoreUrl = getCheckBackupUrl(device);
    const statesInProgressBar =
        deviceModelInternal === DeviceModelInternal.T1B1
            ? [
                  'initial',
                  'select-word-count',
                  'select-recovery-type',
                  'waiting-for-confirmation',
                  'in-progress',
                  'finished',
              ]
            : ['initial', 'in-progress', 'finished'];

    if (!device || !device.features || !deviceModelInternal) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                isCancelable
                onCancel={onCancel}
                data-testid="@recovery/no-device"
            >
                <StyledImage image="CONNECT_DEVICE" width="360" />
            </Modal>
        );
    }

    const actionButtons = (
        <>
            {recovery.status === 'initial' ? (
                <StyledButton
                    onClick={() =>
                        deviceModelInternal === DeviceModelInternal.T1B1
                            ? dispatch(setStatus('select-word-count'))
                            : dispatch(checkSeed())
                    }
                    isDisabled={!understood || isLocked()}
                    data-testid="@recovery/start-button"
                >
                    <Translation id="TR_START" />
                </StyledButton>
            ) : (
                <StyledButton onClick={() => onCancel()}>
                    <Translation id="TR_CLOSE" />
                </StyledButton>
            )}
        </>
    );

    const getStep = () => {
        const isShamirBackupAvailable =
            device?.features?.capabilities?.includes('Capability_Shamir');

        // Shamir backup uses 20 and 33 word shares
        const seedBackupLengthMessage = isShamirBackupAvailable
            ? 'TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR'
            : 'TR_SEED_BACKUP_LENGTH';

        switch (recovery.status) {
            case 'initial':
                return (
                    <>
                        <LeftAlignedP typographyStyle="hint">
                            <Translation id={seedBackupLengthMessage} />
                        </LeftAlignedP>

                        <StepsContainer>
                            <InstructionStep
                                number="1"
                                title={
                                    <Translation
                                        id={`TR_CHECK_RECOVERY_SEED_DESC_${deviceModelInternal === DeviceModelInternal.T2B1 || deviceModelInternal === DeviceModelInternal.T3B1 ? 'T2B1' : deviceModelInternal}`}
                                    />
                                }
                            >
                                <Translation
                                    id={
                                        isShamirBackupAvailable
                                            ? 'TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR'
                                            : 'TR_SEED_BACKUP_LENGTH'
                                    }
                                />
                            </InstructionStep>

                            <InstructionStep
                                number="2"
                                title={<Translation id="TR_ENTER_ALL_WORDS_IN_CORRECT" />}
                            >
                                <Translation
                                    id={pickByDeviceModel(deviceModelInternal, {
                                        default: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
                                        [DeviceModelInternal.T1B1]: 'TR_SEED_WORDS_ENTER_COMPUTER',
                                        [DeviceModelInternal.T2B1]: 'TR_SEED_WORDS_ENTER_BUTTONS',
                                    })}
                                />
                            </InstructionStep>
                        </StepsContainer>

                        <CheckItem
                            data-testid="@recovery/user-understands-checkbox"
                            title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                            description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                            isChecked={understood}
                            link={learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
                            onClick={() => setUnderstood(!understood)}
                        />
                    </>
                );
            case 'select-word-count':
                return (
                    <>
                        <StatusTitle>
                            <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
                        </StatusTitle>
                        <SelectWordCount onSelect={onSetWordsCount} />
                    </>
                );
            case 'select-recovery-type':
                return (
                    <>
                        <StatusTitle>
                            <Translation id="TR_CHOOSE_RECOVERY_TYPE" />
                        </StatusTitle>
                        <SelectRecoveryType onSelect={onSetRecoveryType} />
                    </>
                );
            case 'in-progress':
            case 'waiting-for-confirmation':
                return modal.context !== '@modal/context-none' ? (
                    <>
                        {device.features.capabilities.includes('Capability_PassphraseEntry') && (
                            <LeftAlignedP typographyStyle="hint">
                                <Translation id="TR_ENTER_SEED_WORDS_ON_DEVICE" />
                            </LeftAlignedP>
                        )}
                        <ReduxModal {...modal} />
                    </>
                ) : (
                    <Loading />
                );
            case 'finished':
                return !recovery.error ? (
                    <VerticalCenter>
                        <StatusImage image="UNI_SUCCESS" />
                        <H2 data-testid="@recovery/success-title">
                            <Translation id="TR_SEED_CHECK_SUCCESS_TITLE" />
                        </H2>
                        <StyledP typographyStyle="hint">
                            <Translation id="TR_SEED_CHECK_SUCCESS_DESC" />
                        </StyledP>
                    </VerticalCenter>
                ) : (
                    <VerticalCenter>
                        <StatusImage image="UNI_ERROR" />
                        <H2>
                            <Translation id="TR_SEED_CHECK_FAIL_TITLE" />
                        </H2>
                        <StyledP typographyStyle="hint">
                            <Translation
                                id="TR_RECOVERY_ERROR"
                                values={{ error: recovery.error }}
                            />
                        </StyledP>
                    </VerticalCenter>
                );
            // no default
        }
    };

    return (
        <StyledModal
            heading={<Translation id="TR_CHECK_RECOVERY_SEED" />}
            totalProgressBarSteps={statesInProgressBar.length}
            currentProgressBarStep={statesInProgressBar.findIndex(s => s === recovery.status) + 1}
            bottomBarComponents={actionButtons}
            isCancelable
            onCancel={() => {
                if (['in-progress', 'waiting-for-confirmation'].includes(recovery.status)) {
                    TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
                } else {
                    onCancel();
                }
            }}
        >
            {getStep()}
        </StyledModal>
    );
};
