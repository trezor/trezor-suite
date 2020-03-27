import React, { useState } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Button, H2, P, colors, variables } from '@trezor/components';

import { SelectWordCount, SelectRecoveryType, Error } from '@recovery-components';
import {
    ProgressBar,
    Loading,
    Translation,
    CheckItem,
    ExternalLink,
    Image,
} from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import * as recoveryActions from '@recovery-actions/recoveryActions';
import { InjectedModalApplicationProps, AppState, Dispatch } from '@suite-types';
import { WordCount } from '@recovery-types';

import { URLS } from '@suite-constants';

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
    margin-left: 12px;
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
    width: 16px;
    height: 16px;
    background-color: ${colors.BLACK70};
    border-radius: 50%;
    color: ${colors.WHITE};
    font-size: ${variables.FONT_SIZE.SMALL};
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
    const [understood, setUnderstood] = useState(false);

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
                        <Translation id="TR_CHECK_RECOVERY_SEED" />
                    </H2>
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
                    <H2>
                        <Translation id="TR_CHECK_RECOVERY_SEED" />
                    </H2>
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
                        title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                        description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                        isChecked={understood}
                        link={
                            <ExternalLink size="small" href={URLS.DRY_RUN_URL}>
                                <Translation id="TR_WHAT_IS_DRY_RUN" />
                            </ExternalLink>
                        }
                        onClick={() => setUnderstood(!understood)}
                    />

                    <StyledButton
                        onClick={() => (model === 1 ? setStatus('select-word-count') : checkSeed())}
                        isDisabled={!understood}
                    >
                        <Translation id="TR_START" />
                    </StyledButton>
                    <Buttons>
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            <Translation id="TR_CANCEL" />
                        </StyledButton>
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
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            <Translation id="TR_CANCEL" />
                        </StyledButton>
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
                        <StyledButton
                            icon="CROSS"
                            variant="tertiary"
                            onClick={() => closeModalApp()}
                        >
                            <Translation id="TR_CANCEL" />
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
                    <H2>
                        <Translation id="TR_SEED_CHECK_SUCCESS_TITLE" />
                    </H2>
                    <StyledP>
                        <Translation id="TR_SEED_CHECK_SUCCESS_DESC" />
                    </StyledP>
                    <Image image="UNI_SUCCESS" />
                    <Buttons>
                        <StyledButton onClick={() => closeModalApp()}>
                            <Translation id="TR_CLOSE" />
                        </StyledButton>
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
                        <StyledButton onClick={() => closeModalApp()}>
                            <Translation id="TR_CLOSE" />
                        </StyledButton>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Recovery);
