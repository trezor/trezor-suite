import React, { useCallback, useState } from 'react';
import { Button } from '@trezor/components';
import { withInvityLayout, WithInvityLayoutProps } from '@wallet-components';
import { useSavingsAML } from '@wallet-hooks/coinmarket/savings/useSavingsAML';
import styled from 'styled-components';
import { Translation } from '@suite-components';

const Header = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 8px;
`;

const Description = styled.div`
    font-size: 12px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 28px;
`;

const AmlQuestion = styled.div`
    margin-bottom: 24px;
`;

const AmlQuestionCounter = styled.div`
    font-size: 12px;
    line-height: 24px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 9px;
`;

const AmlQuestionHeader = styled.div`
    font-size: 24px;
    line-height: 24px;
    margin-bottom: 15px;
`;

const AmlAnswerOptions = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: flex-start;
`;

const AmlAnswerOption = styled.div<AmlAnswerOptionProps>`
    color: ${props => (props.isSelected ? '#141414' : props.theme.TYPE_LIGHT_GREY)};
    background: ${props => props.theme.BG_WHITE};
    border: ${props =>
        props.isSelected ? `2px solid ${props.theme.TYPE_GREEN}` : '2px solid #E8E8E8'};
    box-sizing: border-box;
    border-radius: 66px;
    padding: 9px 16px;
    cursor: pointer;
    margin: 10px 10px 0 0;
`;

interface AmlAnswerOptionProps {
    isSelected: boolean;
}

interface KeyAnswer {
    [key: string]: string;
}

const AML = (props: WithInvityLayoutProps) => {
    const { amlQuestions, handleSubmit } = useSavingsAML(props);
    const [selectedAnswerKeys, setSelectedAnswerKeys] = useState<KeyAnswer>({});
    const handleAmlAnswerOptionClick = useCallback(
        (key: string, answer: string) => {
            setSelectedAnswerKeys({
                ...selectedAnswerKeys,
                [key]: answer,
            });
        },
        [selectedAnswerKeys],
    );
    const canSubmitAnswers = Object.entries(selectedAnswerKeys).length === amlQuestions?.length;
    const answers = Object.entries(selectedAnswerKeys).map(([key, answer]) => ({
        key,
        answer,
    }));
    return (
        <>
            <Header>
                <Translation id="TR_SAVINGS_AML_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_AML_DESCRIPTION" />
            </Description>
            {amlQuestions?.map((question, index) => (
                <AmlQuestion key={question.key}>
                    <AmlQuestionCounter>
                        <Translation
                            id="TR_SAVINGS_AML_ONE_OF_MANY"
                            values={{
                                index: index + 1,
                                totalCount: amlQuestions.length,
                            }}
                        />
                    </AmlQuestionCounter>
                    <AmlQuestionHeader>{question.label}</AmlQuestionHeader>
                    <AmlAnswerOptions>
                        {question.answerOptions.map(answer => (
                            <AmlAnswerOption
                                key={answer}
                                onClick={() => handleAmlAnswerOptionClick(question.key, answer)}
                                isSelected={selectedAnswerKeys[question.key] === answer}
                            >
                                {answer}
                            </AmlAnswerOption>
                        ))}
                    </AmlAnswerOptions>
                </AmlQuestion>
            ))}
            <Button
                type="button"
                isDisabled={!canSubmitAnswers}
                onClick={() => handleSubmit(answers)}
            >
                <Translation id="TR_SAVINGS_AML_SUBMIT_BUTTON" />
            </Button>
        </>
    );
};
export default withInvityLayout(AML, {
    showStepsGuide: true,
});
