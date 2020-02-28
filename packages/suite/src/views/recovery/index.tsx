import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Button, H2, P, colors, variables } from '@trezor/components';

import { SelectWordCount, SelectRecoveryType, Error } from '@recovery-components';
import { ProgressBar, Loading, Translation } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { InjectedModalApplicationProps, AppState, Dispatch } from '@suite-types';
import { WordCount } from '@recovery-types';
import messages from '@suite/support/messages';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled(ModalWrapper)`
    min-width: 60vw;
    max-width: 80vw;
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Buttons = styled(Row)`
    justify-content: center;
    margin-top: auto;
`;

const StyledButton = styled(Button)`
    min-width: 224px;
    margin-bottom: 16px;
    margin-top: 28px;
`;

const InfoBox = styled.div`
    display: flex;
    width: 400px;
    margin-top: 28px;
`;

const InfoBoxText = styled.div`
    display: flex;
    width: 360px;
    flex-direction: column;
    text-align: left;
    margin-left: 8px;
`;
const InfoBoxTitle = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK0};
    margin-bottom: 8px;
`;

const InfoBoxDescription = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
`;

const Number = styled.div`
    width: 15px;
    height: 15px;
    background-color: ${colors.BLACK70};
    border-radius: 50%;
    color: ${colors.WHITE};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledP = styled(P)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
`;

const mapStateToProps = (state: AppState) => ({
    recovery: state.recovery,
    locks: state.suite.locks,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    checkSeed: bindActionCreators(recoveryActions.checkSeed, dispatch),
    setStatus: bindActionCreators(recoveryActions.setStatus, dispatch),
    setWordsCount: bindActionCreators(recoveryActions.setWordsCount, dispatch),
    setAdvancedRecovery: bindActionCreators(recoveryActions.setAdvancedRecovery, dispatch),
});

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

    return (
        <Wrapper>
            <ProgressBar
                total={statesInProgressBar.length}
                current={statesInProgressBar.findIndex(s => s === recovery.status) + 1}
            />

            {recovery.status === 'initial' && model === 1 && (
                <>
                    <H2>
                        <Translation {...messages.TR_CHECK_RECOVERY_SEED} />
                    </H2>
                    <StyledP>
                        <Translation {...messages.TR_CHECK_RECOVERY_SEED_DESC_T1} />
                    </StyledP>
                    <InfoBox>
                        <Number>1</Number>
                        <InfoBoxText>
                            <InfoBoxTitle>
                                <Translation {...messages.TR_SELECT_NUMBER_OF_WORDS} />
                            </InfoBoxTitle>
                            <InfoBoxDescription>
                                <Translation {...messages.TR_YOU_EITHER_HAVE} />
                            </InfoBoxDescription>
                        </InfoBoxText>
                    </InfoBox>
                    <InfoBox>
                        <Number>2</Number>
                        <InfoBoxText>
                            <InfoBoxTitle>
                                <Translation {...messages.TR_ENTER_ALL_WORDS_IN_CORRECT} />
                            </InfoBoxTitle>
                            <InfoBoxDescription>
                                <Translation {...messages.TR_ON_YOUR_COMPUTER_ENTER} />
                            </InfoBoxDescription>
                        </InfoBoxText>
                    </InfoBox>
                    <StyledButton onClick={() => setStatus('select-word-count')}>
                        Start
                    </StyledButton>
                    <Buttons>
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            Cancel
                            {/* waiting for RP to be merged */}
                            {/* <Translation {...messsages.TR_CANCEL}/> */}
                        </StyledButton>
                    </Buttons>
                </>
            )}

            {recovery.status === 'initial' && model === 2 && (
                <>
                    <H2>
                        <Translation {...messages.TR_CHECK_RECOVERY_SEED} />
                    </H2>
                    <H2>Check recovery seed</H2>
                    <StyledP>
                        Your wallet backup, the recovery seed, is entered entirely on the Trezor
                        Model T, through the device screen. We avoid passing any of your sensitive
                        information to a potentially insecure computer or web browser.
                    </StyledP>

                    <InfoBox>
                        <Number>1</Number>
                        <InfoBoxText>
                            <InfoBoxTitle>Select number of words in your seed</InfoBoxTitle>
                            <InfoBoxDescription>
                                You either have a seed containing 12, 18 or 24 words.
                            </InfoBoxDescription>
                        </InfoBoxText>
                    </InfoBox>

                    <InfoBox>
                        <Number>2</Number>
                        <InfoBoxText>
                            <InfoBoxTitle>Enter all words in the correct order</InfoBoxTitle>
                            <InfoBoxDescription>
                                Using the touchscreen display you enter all the words in the correct
                                order until completed.
                            </InfoBoxDescription>
                        </InfoBoxText>
                    </InfoBox>

                    <StyledButton onClick={() => checkSeed()}>Start</StyledButton>

                    <Buttons>
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            Cancel seed check
                        </StyledButton>
                    </Buttons>
                </>
            )}

            {recovery.status === 'select-word-count' && (
                <>
                    <H2>
                        <Translation {...messages.TR_SELECT_NUMBER_OF_WORDS} />
                    </H2>
                    <SelectWordCount onSelect={(count: WordCount) => onSetWordsCount(count)} />
                    <Buttons>
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            Cancel seed check
                        </StyledButton>
                    </Buttons>
                </>
            )}
            {recovery.status === 'select-recovery-type' && (
                <>
                    <H2>Chose recovery type</H2>
                    <SelectRecoveryType onSelect={(type: boolean) => onSetRecoveryType(type)} />
                    <Buttons>
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            Cancel seed check
                        </StyledButton>
                    </Buttons>
                </>
            )}

            {recovery.status === 'in-progress' && (
                <>
                    {!modal && <Loading />}
                    {modal && (
                        <>
                            {model === 2 && (
                                <StyledP>
                                    All the words are entered only on the device as a extra security
                                    feature. Please enter all the words in the correct order
                                    carefully.
                                </StyledP>
                            )}
                            {modal}
                        </>
                    )}
                </>
            )}
            {recovery.status === 'finished' && !recovery.error && (
                <>
                    <H2>Great success.</H2>
                    <StyledP>Seed you have entered now matches the seed in device</StyledP>
                    <img alt="" src={resolveStaticPath('images/suite/uni-success.svg')} />
                    <Buttons>
                        <StyledButton onClick={() => closeModalApp()}>Close</StyledButton>
                    </Buttons>
                </>
            )}

            {recovery.status === 'finished' && recovery.error && (
                <>
                    <H2>Seed check failed</H2>
                    <Error error={recovery.error} />
                    <Buttons>
                        <StyledButton onClick={() => closeModalApp()}>Close</StyledButton>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Recovery);
