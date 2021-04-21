import React, { useState } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Button, ButtonProps, H2, P, variables } from '@trezor/components';

import { SelectWordCount, SelectRecoveryType, Error } from '@recovery-components';
import { Loading, Translation, CheckItem, ExternalLink, Image, Modal } from '@suite-components';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { InjectedModalApplicationProps, AppState, Dispatch } from '@suite-types';
import { WordCount } from '@recovery-types';
import { useDevice } from '@suite-hooks';
import { URLS } from '@suite-constants';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    height: 100%;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Buttons = styled(Row)`
    justify-content: center;
    margin-top: auto;
    flex-direction: column;
`;

const StyledButton = styled(Button)`
    min-width: 224px;
    margin-bottom: 16px;
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

const StyledImage = styled(Image)`
    flex: 1;
`;

const CloseButton = (props: ButtonProps) => (
    <StyledButton {...props} data-test="@recovery/close-button" variant="tertiary" icon="CROSS">
        {props.children ? props.children : <Translation id="TR_CLOSE" />}
    </StyledButton>
);

const mapStateToProps = (state: AppState) => ({
    recovery: state.recovery,
    locks: state.suite.locks,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            checkSeed: recoveryActions.checkSeed,
            setStatus: recoveryActions.setStatus,
            setWordsCount: recoveryActions.setWordsCount,
            setAdvancedRecovery: recoveryActions.setAdvancedRecovery,
        },
        dispatch,
    );

export type Props = InjectedModalApplicationProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const Recovery = ({
    recovery,
    checkSeed,
    setWordsCount,
    setAdvancedRecovery,
    modal,
    closeModalApp,
    device,
    setStatus,
}: Props) => {
    const model = device?.features?.major_version;
    const [understood, setUnderstood] = useState(false);
    const { isLocked } = useDevice();
    const onSetWordsCount = (count: WordCount) => {
        setWordsCount(count);
        setStatus('select-recovery-type');
    };

    const onSetRecoveryType = (type: boolean) => {
        setAdvancedRecovery(type);
        checkSeed();
    };

    const statesInProgressBar =
        model === 1
            ? ['initial', 'select-word-count', 'select-recovery-type', 'in-progress', 'finished']
            : ['initial', 'in-progress', 'finished'];

    if (!device || !device.features) {
        return (
            <Modal
                size="tiny"
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                cancelable
                onCancel={closeModalApp}
                data-test="@recovery/no-device"
            >
                <StyledImage image="CONNECT_DEVICE" />
                <Buttons>
                    <CloseButton onClick={() => closeModalApp()} />
                </Buttons>
            </Modal>
        );
    }

    return (
        <Modal
            useFixedHeight
            heading={<Translation id="TR_CHECK_RECOVERY_SEED" />}
            totalProgressBarSteps={statesInProgressBar.length}
            currentProgressBarStep={statesInProgressBar.findIndex(s => s === recovery.status) + 1}
        >
            <Wrapper>
                {recovery.status === 'initial' && model === 1 && (
                    <>
                        <StyledP>
                            <Translation id="TR_CHECK_RECOVERY_SEED_DESC_T1" />
                        </StyledP>
                        <InfoBox>
                            <Number>1</Number>
                            <InfoBoxText>
                                <InfoBoxTitle>
                                    <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
                                </InfoBoxTitle>
                                <InfoBoxDescription>
                                    <Translation id="TR_YOU_EITHER_HAVE_T1" />
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
                                    <Translation id="TR_ON_YOUR_COMPUTER_ENTER" />
                                </InfoBoxDescription>
                            </InfoBoxText>
                        </InfoBox>
                    </>
                )}

                {recovery.status === 'initial' && model === 2 && (
                    <>
                        <StyledP>
                            <Translation id="TR_CHECK_RECOVERY_SEED_DESC_T2" />
                        </StyledP>

                        <InfoBox>
                            <Number>1</Number>
                            <InfoBoxText>
                                <InfoBoxTitle>
                                    <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
                                </InfoBoxTitle>
                                <InfoBoxDescription>
                                    <Translation id="TR_YOU_EITHER_HAVE_T2" />
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
                                    <Translation id="TR_USING_TOUCHSCREEN" />
                                </InfoBoxDescription>
                            </InfoBoxText>
                        </InfoBox>
                    </>
                )}

                {recovery.status === 'initial' && (
                    <>
                        <CheckItem
                            data-test="@recovery/user-understands-checkbox"
                            title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                            description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                            isChecked={understood}
                            link={
                                <ExternalLink size="tiny" href={URLS.DRY_RUN_URL}>
                                    <Translation id="TR_LEARN_MORE" />
                                </ExternalLink>
                            }
                            onClick={() => setUnderstood(!understood)}
                        />

                        <Buttons>
                            <StyledButton
                                onClick={() =>
                                    model === 1 ? setStatus('select-word-count') : checkSeed()
                                }
                                isDisabled={!understood || isLocked()}
                                data-test="@recovery/start-button"
                            >
                                <Translation id="TR_START" />
                            </StyledButton>
                            <CloseButton onClick={() => closeModalApp()}>
                                <Translation id="TR_CANCEL" />
                            </CloseButton>
                        </Buttons>
                    </>
                )}

                {recovery.status === 'select-word-count' && (
                    <>
                        <H2>
                            <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
                        </H2>
                        <SelectWordCount onSelect={(count: WordCount) => onSetWordsCount(count)} />
                        <Buttons>
                            <CloseButton onClick={() => closeModalApp()}>
                                <Translation id="TR_CANCEL" />
                            </CloseButton>
                        </Buttons>
                    </>
                )}
                {recovery.status === 'select-recovery-type' && (
                    <>
                        <H2>
                            <Translation id="TR_CHOSE_RECOVERY_TYPE" />
                        </H2>
                        <SelectRecoveryType onSelect={(type: boolean) => onSetRecoveryType(type)} />
                        <Buttons>
                            <CloseButton onClick={() => closeModalApp()}>
                                <Translation id="TR_CANCEL" />
                            </CloseButton>
                        </Buttons>
                    </>
                )}

                {(recovery.status === 'in-progress' ||
                    recovery.status === 'waiting-for-confirmation') && (
                    <>
                        {!modal && <Loading noBackground />}
                        {modal && (
                            <>
                                {model === 2 && (
                                    <StyledP>
                                        <Translation id="TR_ALL_THE_WORDS" />
                                    </StyledP>
                                )}
                                {modal}
                            </>
                        )}
                    </>
                )}
                {recovery.status === 'finished' && !recovery.error && (
                    <>
                        <H2 data-test="@recovery/success-title">
                            <Translation id="TR_SEED_CHECK_SUCCESS_TITLE" />
                        </H2>
                        <StyledP>
                            <Translation id="TR_SEED_CHECK_SUCCESS_DESC" />
                        </StyledP>
                        <StyledImage image="UNI_SUCCESS" width="160" />
                        <Buttons>
                            <CloseButton onClick={() => closeModalApp()} />
                        </Buttons>
                    </>
                )}

                {recovery.status === 'finished' && recovery.error && (
                    <>
                        <H2>
                            <Translation id="TR_SEED_CHECK_FAIL_TITLE" />
                        </H2>
                        <Error error={recovery.error} />
                        <Buttons>
                            <CloseButton onClick={() => closeModalApp()} />
                        </Buttons>
                    </>
                )}
            </Wrapper>
        </Modal>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Recovery);
