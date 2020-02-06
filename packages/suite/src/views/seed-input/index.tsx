import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Button, H2, P, colors, variables } from '@trezor/components-v2';

import { ProgressBar } from '@suite-components';
import * as recoveryActions from '@settings-actions/recoveryActions';
import { InjectedModalApplicationProps, AppState, Dispatch } from '@suite-types';
import { WordCount } from '@settings-types';
import { resolveStaticPath } from '@suite-utils/nextjs';

const Wrapper = styled.div`
    width: 60vw;
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
`;

const Buttons = styled(Row)`
    justify-content: center;
    margin-top: auto;
`;

const StyledButton = styled(Button)`
    min-width: 226px;
    margin-bottom: 16px;
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

interface WordsButtonProps {
    isActive: boolean;
    count: WordCount;
    onClick: () => void;
}

const WordsButton = ({ isActive, count, ...props }: WordsButtonProps) => (
    <Button variant={isActive ? 'primary' : 'secondary'} {...props}>
        {count} words
    </Button>
);

interface TypeButton {
    isActive: boolean;
    type: string;
    onClick: () => void;
}

const TypeButton = ({ isActive, type, ...props }: TypeButton) => (
    <Button variant={isActive ? 'primary' : 'secondary'} {...props}>
        {type}
    </Button>
);

const mapStateToProps = (state: AppState) => ({
    recovery: state.settings.recovery,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    checkSeed: bindActionCreators(recoveryActions.checkSeed, dispatch),
    setWordsCount: bindActionCreators(recoveryActions.setWordsCount, dispatch),
    setAdvancedRecovery: bindActionCreators(recoveryActions.setAdvancedRecovery, dispatch),
});

export type Props = InjectedModalApplicationProps &
    ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

const SeedInput = ({
    recovery,
    checkSeed,
    setWordsCount,
    setAdvancedRecovery,
    modal,
    closeModalApp,
}: Props) => {
    return (
        <Wrapper>
            <ProgressBar total={2} current={1} />

            {modal && (
                <>
                    <H2>Follow instructions on your device</H2>
                    <StyledP>
                        All the words are entered only on the device as a extra security feature.
                        Please enter all the words in the correct order carefully.
                    </StyledP>
                    {modal}
                </>
            )}

            {!modal && (
                <>
                    {recovery.success === null && (
                        <>
                            <H2>Check recovery seed</H2>
                            <StyledP>
                                Your wallet backup, the recovery seed, is entered entirely on the
                                Trezor Model T, through the device screen. We avoid passing any of
                                your sensitive information to a potentially insecure computer or web
                                browser.
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
                                    <InfoBoxTitle>
                                        Enter all words in the correct order
                                    </InfoBoxTitle>
                                    <InfoBoxDescription>
                                        Using the touchscreen display you enter all the words in the
                                        correct order until completed.
                                    </InfoBoxDescription>
                                </InfoBoxText>
                            </InfoBox>

                            <StyledButton onClick={() => checkSeed()}>Start</StyledButton>
                        </>
                    )}

                    {recovery.success === true && (
                        <>
                            <StyledP>Seed you have entered now matches the seed in device</StyledP>
                            <H2>Great success.</H2>
                            <img alt="" src={resolveStaticPath('images/suite/uni-success.svg')} />
                        </>
                    )}

                    {recovery.success === false && (
                        <>
                            <H2>Seed check failed</H2>
                            <StyledP>{recovery.error}</StyledP>
                            <img alt="" src={resolveStaticPath('images/suite/uni-error.svg')} />
                        </>
                    )}

                    <Buttons>
                        <StyledButton icon="CROSS" variant="tertiary" onClick={closeModalApp}>
                            Cancel seed check
                        </StyledButton>
                    </Buttons>
                </>
            )}
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(SeedInput);

{
    /* <Row>
                <WordsButton
                    isActive={recovery.wordsCount === 12}
                    count={12}
                    onClick={() => setWordsCount(12)}
                />
                <WordsButton
                    isActive={recovery.wordsCount === 18}
                    count={18}
                    onClick={() => setWordsCount(18)}
                />
                <WordsButton
                    isActive={recovery.wordsCount === 24}
                    count={24}
                    onClick={() => setWordsCount(24)}
                />
            </Row>

            <Row>
                <H2>Advanced seed input</H2>
            </Row>
            <Row>
                <TypeButton
                    isActive={!recovery.advancedRecovery}
                    type="basic"
                    onClick={() => setAdvancedRecovery(false)}
                />
                <TypeButton
                    isActive={recovery.advancedRecovery}
                    type="advanced"
                    onClick={() => setAdvancedRecovery(true)}
                />
            </Row>

            <Row>
                <Button onClick={() => checkSeed()}>Start</Button>
                <Button variant="secondary" onClick={closeModalApp}>
                    Close
                </Button>
            </Row> */
}
