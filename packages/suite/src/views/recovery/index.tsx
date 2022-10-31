import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, H2, P, Image, variables } from '@trezor/components';
import { SelectWordCount, SelectRecoveryType } from '@recovery-components';
import { Loading, Translation, CheckItem, TrezorLink, Modal } from '@suite-components';
import { RawRenderer } from '@suite-components/Modal/RawRenderer';
import { ReduxModal } from '@suite-components/ModalSwitcher/ReduxModal';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import type { ForegroundAppProps } from '@suite-types';
import type { WordCount } from '@recovery-types';
import { InstructionStep } from '@suite-components/InstructionStep';
import { getCheckBackupUrl } from '@suite-utils/device';
import { getDeviceModel } from '@trezor/device-utils';

const StyledModal = styled(Modal)`
    min-height: 420px;
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

const LeftAlignedP = styled(StyledP)`
    text-align: left;
`;

const StatusImage = styled(Image)`
    padding-bottom: 24px;
`;

const StatusTitle = styled(H2)`
    margin: 0px 0px 12px;
`;

const VerticalCenter = styled.div`
    margin-top: auto;
    margin-bottom: auto;
`;

const TinyModal = styled(Modal)`
    width: 360px;
`;

const InstructionModal = styled(RawRenderer)`
    margin: 54px auto 0;
`;

type CloseButtonProps = { onClick: () => void; variant: 'TR_CLOSE' | 'TR_CANCEL' };

const CloseButton = ({ onClick, variant }: CloseButtonProps) => (
    <StyledButton
        onClick={onClick}
        data-test="@recovery/close-button"
        variant="secondary"
        icon="CROSS"
    >
        <Translation id={variant} />
    </StyledButton>
);

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

    const model = device && getDeviceModel(device) === '1' ? '1' : 'T';
    const learnMoreUrl = getCheckBackupUrl(device);
    const isModelOne = model === '1';
    const statesInProgressBar = isModelOne
        ? ['initial', 'select-word-count', 'select-recovery-type', 'in-progress', 'finished']
        : ['initial', 'in-progress', 'finished'];

    if (!device || !device.features) {
        return (
            <TinyModal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                isCancelable
                onCancel={onCancel}
                data-test="@recovery/no-device"
                bottomBar={<CloseButton onClick={() => onCancel()} variant="TR_CLOSE" />}
            >
                <Image image="CONNECT_DEVICE" />
            </TinyModal>
        );
    }

    const actionButtons = (
        <>
            {['initial', 'select-word-count', 'select-recovery-type', 'finished'].includes(
                recovery.status,
            ) && (
                <CloseButton
                    onClick={() => onCancel()}
                    variant={recovery.status === 'finished' ? 'TR_CLOSE' : 'TR_CANCEL'}
                />
            )}
            {recovery.status === 'initial' && (
                <StyledButton
                    onClick={() =>
                        isModelOne ? actions.setStatus('select-word-count') : actions.checkSeed()
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
        switch (recovery.status) {
            case 'initial':
                return (
                    <>
                        <LeftAlignedP>
                            {model && <Translation id={`TR_CHECK_RECOVERY_SEED_DESC_T${model}`} />}
                        </LeftAlignedP>

                        <StepsContainer>
                            <InstructionStep
                                number="1"
                                title={<Translation id="TR_SELECT_NUMBER_OF_WORDS" />}
                            >
                                {model && <Translation id={`TR_YOU_EITHER_HAVE_T${model}`} />}
                            </InstructionStep>

                            <InstructionStep
                                number="2"
                                title={<Translation id="TR_ENTER_ALL_WORDS_IN_CORRECT" />}
                            >
                                <Translation
                                    id={
                                        isModelOne
                                            ? 'TR_ON_YOUR_COMPUTER_ENTER'
                                            : 'TR_USING_TOUCHSCREEN'
                                    }
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
                            <Translation id="TR_CHOSE_RECOVERY_TYPE" />
                        </StatusTitle>
                        <SelectRecoveryType onSelect={onSetRecoveryType} />
                    </>
                );
            case 'in-progress':
            case 'waiting-for-confirmation':
                return modal.context !== '@modal/context-none' ? (
                    <>
                        {!isModelOne && (
                            <LeftAlignedP>
                                <Translation id="TR_ALL_THE_WORDS" />
                            </LeftAlignedP>
                        )}
                        <ReduxModal {...modal} renderer={InstructionModal} />
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
        >
            {getStep()}
        </StyledModal>
    );
};
