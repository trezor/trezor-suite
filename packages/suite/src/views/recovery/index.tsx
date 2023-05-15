import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, H2, P, Image, variables } from '@trezor/components';
import { SelectWordCount, SelectRecoveryType } from '@recovery-components';
import { Loading, Translation, CheckItem, TrezorLink, Modal } from '@suite-components';
import { ReduxModal } from '@suite-components/ModalSwitcher/ReduxModal';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import type { ForegroundAppProps } from '@suite-types';
import type { WordCount } from '@recovery-types';
import { InstructionStep } from '@suite-components/InstructionStep';
import { getCheckBackupUrl } from '@suite-utils/device';
import { DeviceModel, getDeviceModel, pickByDeviceModel } from '@trezor/device-utils';
import TrezorConnect from '@trezor/connect';

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

const StyledP = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    const { recovery, modal } = useSelector(state => ({
        recovery: state.recovery,
        modal: state.modal,
    }));
    const actions = useActions({
        checkSeed: recoveryActions.checkSeed,
        setStatus: recoveryActions.setStatus,
        setWordsCount: recoveryActions.setWordsCount,
        setAdvancedRecovery: recoveryActions.setAdvancedRecovery,
    });
    const { device, isLocked } = useDevice();
    const [understood, setUnderstood] = useState(false);

    const onSetWordsCount = (count: WordCount) => {
        actions.setWordsCount(count);
        actions.setStatus('select-recovery-type');
    };

    const onSetRecoveryType = (type: 'standard' | 'advanced') => {
        actions.setAdvancedRecovery(type === 'advanced');
        actions.checkSeed();
    };

    const deviceModel = getDeviceModel(device);
    const learnMoreUrl = getCheckBackupUrl(device);
    const statesInProgressBar =
        deviceModel === DeviceModel.T1
            ? [
                  'initial',
                  'select-word-count',
                  'select-recovery-type',
                  'waiting-for-confirmation',
                  'in-progress',
                  'finished',
              ]
            : ['initial', 'in-progress', 'finished'];

    if (!device || !device.features || !deviceModel) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                isCancelable
                onCancel={onCancel}
                data-test="@recovery/no-device"
            >
                <StyledImage image="CONNECT_DEVICE" width="360" />
            </Modal>
        );
    }

    const actionButtons = (
        <>
            {recovery.status === 'initial' && (
                <StyledButton
                    onClick={() =>
                        deviceModel === DeviceModel.T1
                            ? actions.setStatus('select-word-count')
                            : actions.checkSeed()
                    }
                    isDisabled={!understood || isLocked()}
                    data-test="@recovery/start-button"
                >
                    <Translation id="TR_START" />
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
                        <LeftAlignedP>
                            <Translation id={seedBackupLengthMessage} />
                        </LeftAlignedP>

                        <StepsContainer>
                            <InstructionStep
                                number="1"
                                title={
                                    <Translation
                                        id={`TR_CHECK_RECOVERY_SEED_DESC_T${deviceModel}`}
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
                                    id={pickByDeviceModel(deviceModel, {
                                        default: 'TR_SEED_WORDS_ENTER_BUTTONS',
                                        [DeviceModel.T1]: 'TR_SEED_WORDS_ENTER_COMPUTER',
                                        [DeviceModel.TT]: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
                                        [DeviceModel.T2B1]: 'TR_SEED_WORDS_ENTER_BUTTONS',
                                    })}
                                />
                            </InstructionStep>
                        </StepsContainer>

                        <CheckItem
                            data-test="@recovery/user-understands-checkbox"
                            title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                            description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                            isChecked={understood}
                            link={
                                <TrezorLink icon="EXTERNAL_LINK" size="tiny" href={learnMoreUrl}>
                                    <Translation id="TR_LEARN_MORE" />
                                </TrezorLink>
                            }
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
                            <LeftAlignedP>
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
                        <H2 data-test="@recovery/success-title">
                            <Translation id="TR_SEED_CHECK_SUCCESS_TITLE" />
                        </H2>
                        <StyledP>
                            <Translation id="TR_SEED_CHECK_SUCCESS_DESC" />
                        </StyledP>
                    </VerticalCenter>
                ) : (
                    <VerticalCenter>
                        <StatusImage image="UNI_ERROR" />
                        <H2>
                            <Translation id="TR_SEED_CHECK_FAIL_TITLE" />
                        </H2>
                        <StyledP>
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
            bottomBar={actionButtons}
            isCancelable
            onCancel={() => {
                if (['in-progress', 'waiting-for-confirmation'].includes(recovery.status)) {
                    TrezorConnect.cancel();
                } else {
                    onCancel();
                }
            }}
        >
            {getStep()}
        </StyledModal>
    );
};
