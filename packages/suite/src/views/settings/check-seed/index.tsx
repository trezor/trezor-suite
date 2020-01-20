import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Button, H2, P } from '@trezor/components-v2';

import * as recoveryActions from '@settings-actions/recoveryActions';
import { InjectedModalApplicationProps, AppState, Dispatch } from '@suite-types';

// todo: taken from switch device. grrr
const Wrapper = styled.div`
    padding: 30px 24px;
    display: flex;
    flex-direction: column;
    text-align: center;
    width: 100%;
    min-width: 400px;
    align-items: center;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
`;

interface WordsButtonProps {
    isActive: boolean;
    count: 12 | 18 | 24;
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

const CheckSeed = ({
    recovery,
    checkSeed,
    setWordsCount,
    setAdvancedRecovery,
    modal,
    closeModalApp,
}: Props) => {
    if (modal) {
        return <Wrapper>{modal}</Wrapper>;
    }

    if (recovery.success !== null) {
        return (
            <Wrapper>
                {recovery.success && (
                    <>
                        <H2>Great success.</H2>
                        <P>Seed you have entered now matches the seed in device</P>
                    </>
                )}
                {!recovery.success && (
                    <>
                        <H2>Not so great success.</H2>
                        <P>{recovery.error}</P>
                    </>
                )}

                <Button onClick={closeModalApp}>Close</Button>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <>
                <Row>
                    <H2>Words count</H2>
                </Row>
                <Row>
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
                </Row>
            </>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(CheckSeed);
