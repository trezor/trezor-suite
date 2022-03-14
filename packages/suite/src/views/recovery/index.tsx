import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, H2, P, variables } from '@trezor/components';
import { SelectWordCount, SelectRecoveryType } from '@recovery-components';
import { Loading, Translation, CheckItem, TrezorLink, Image, Modal } from '@suite-components';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { useDevice, useSelector, useActions } from '@suite-hooks';
import { URLS } from '@suite-constants';
import type { InjectedModalApplicationProps } from '@suite-types';
import type { WordCount } from '@recovery-types';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    height: 100%;
`;

const StyledButton = styled(Button)`
    width: 224px;
`;

const InfoBox = styled.div`
    display: flex;
    max-width: 400px;
    margin-top: 28px;
`;

const InfoBoxText = styled.div`
    display: flex;
    width: 360px;
    flex-direction: column;
    text-align: left;
    margin-left: 12px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        width: 300px;
    }
`;

const InfoBoxTitle = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin-bottom: 8px;
`;

const InfoBoxDescription = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Number = styled.div`
    width: 16px;
    height: 16px;
    background-color: ${props => props.theme.TYPE_LIGHT_GREY};
    border-radius: 50%;
    color: ${props => props.theme.TYPE_WHITE};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledP = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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

const StyledModal = styled(Modal)`
    min-height: 620px;
`;

const TinyModal = styled(Modal)`
    width: 360px;
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

const getModel = (majorVersion?: number) =>
    majorVersion !== 1 && majorVersion !== 2 ? undefined : majorVersion;

const Recovery = ({ modal, closeModalApp }: InjectedModalApplicationProps) => {
    const { recovery } = useSelector(state => ({
        recovery: state.recovery,
    }));
    const actions = useActions({
        checkSeed: recoveryActions.checkSeed,
        setStatus: recoveryActions.setStatus,
        setWordsCount: recoveryActions.setWordsCount,
        setAdvancedRecovery: recoveryActions.setAdvancedRecovery,
    });
    const { device, isLocked } = useDevice();
    const model = getModel(device?.features?.major_version);
    const [understood, setUnderstood] = useState(false);

    const onSetWordsCount = (count: WordCount) => {
        actions.setWordsCount(count);
        actions.setStatus('select-recovery-type');
    };

    const onSetRecoveryType = (type: 'standard' | 'advanced') => {
        actions.setAdvancedRecovery(type === 'advanced');
        actions.checkSeed();
    };

    const statesInProgressBar =
        model === 1
            ? ['initial', 'select-word-count', 'select-recovery-type', 'in-progress', 'finished']
            : ['initial', 'in-progress', 'finished'];

    if (!device || !device.features) {
        return (
            <TinyModal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                cancelable
                onCancel={closeModalApp}
                data-test="@recovery/no-device"
                bottomBar={<CloseButton onClick={() => closeModalApp()} variant="TR_CLOSE" />}
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
                    onClick={() => closeModalApp()}
                    variant={recovery.status === 'finished' ? 'TR_CLOSE' : 'TR_CANCEL'}
                />
            )}
            {recovery.status === 'initial' && (
                <StyledButton
                    onClick={() =>
                        model === 1 ? actions.setStatus('select-word-count') : actions.checkSeed()
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
                        <StyledP>
                            {model && <Translation id={`TR_CHECK_RECOVERY_SEED_DESC_T${model}`} />}
                        </StyledP>
                        <InfoBox>
                            <Number>1</Number>
                            <InfoBoxText>
                                <InfoBoxTitle>
                                    <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
                                </InfoBoxTitle>
                                <InfoBoxDescription>
                                    {model && <Translation id={`TR_YOU_EITHER_HAVE_T${model}`} />}
                                </InfoBoxDescription>
                            </InfoBoxText>
                        </InfoBox>
                        <InfoBox>
                            <Number>2</Number>
                            <InfoBoxText>
                                <InfoBoxTitle>
                                    <Translation id="TR_ENTER_ALL_WORDS_IN_CORRECT" />
                                </InfoBoxTitle>
                                <InfoBoxDescription>
                                    <Translation
                                        id={
                                            model === 1
                                                ? 'TR_ON_YOUR_COMPUTER_ENTER'
                                                : 'TR_USING_TOUCHSCREEN'
                                        }
                                    />
                                </InfoBoxDescription>
                            </InfoBoxText>
                        </InfoBox>
                        <CheckItem
                            data-test="@recovery/user-understands-checkbox"
                            title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                            description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                            isChecked={understood}
                            link={
                                <TrezorLink
                                    icon="EXTERNAL_LINK"
                                    size="tiny"
                                    href={URLS.DRY_RUN_URL}
                                >
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
                return modal ? (
                    <>
                        {model === 2 && (
                            <StyledP>
                                <Translation id="TR_ALL_THE_WORDS" />
                            </StyledP>
                        )}
                        {modal}
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
            <Wrapper>{getStep()}</Wrapper>
        </StyledModal>
    );
};

export default Recovery;
