import styled from 'styled-components';
import { darken } from 'polished';
import { Button, Icon, variables } from '@trezor/components';
import { HELP_CENTER_COINJOIN_URL } from '@trezor/urls';
import { Translation, TrezorLink } from 'src/components/suite';
import { CoinjoinProcessStep, CoinjoinProcessStepProps } from './CoinjoinProcessStep';
import { mediaQueries } from '@trezor/styles';

const Container = styled.div`
    padding: 20px 20px 16px;
    border-radius: 14px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 18px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const QuestionIcon = styled(Icon)`
    margin-right: 4px;
`;

const Steps = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 20px;
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 12px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: block;
    }
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const StyledButton = styled(Button)`
    margin-right: 12px;
    background: #d9d9d9;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};

    path {
        fill: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    :hover,
    :focus {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, '#d9d9d9')};
    }

    ${mediaQueries.dark_theme} {
        background: ${({ theme }) => theme.BG_WHITE};

        :hover,
        :focus {
            background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.BG_WHITE)};
        }
    }
`;

const STEPS: Array<Omit<CoinjoinProcessStepProps, 'number'>> = [
    {
        image: 'COINS',
        title: <Translation id="TR_COINJOIN_STEP_1_TITLE" />,
        description: <Translation id="TR_COINJOIN_STEP_1_DESCRIPTION" />,
    },
    {
        image: 'BACKUP',
        title: <Translation id="TR_START_COINJOIN" />,
        description: <Translation id="TR_COINJOIN_STEP_2_DESCRIPTION" />,
    },
    {
        image: 'CLOUDY',
        title: <Translation id="TR_COINJOIN_STEP_3_TITLE" />,
        description: <Translation id="TR_COINJOIN_STEP_3_DESCRIPTION" />,
    },
];

export const CoinjoinExplanation = () => (
    <Container>
        <Heading>
            <QuestionIcon icon="QUESTION" size={15} />
            <Translation id="TR_COINJOIN_EXPLANATION_TITLE" />
        </Heading>

        <Steps>
            {STEPS.map((step, index) => (
                <CoinjoinProcessStep number={index + 1} key={step.image} {...step} />
            ))}
        </Steps>

        <ButtonContainer>
            <TrezorLink href={HELP_CENTER_COINJOIN_URL} variant="nostyle">
                <StyledButton icon="EXTERNAL_LINK">
                    <Translation id="TR_LEARN_MORE" />
                </StyledButton>
            </TrezorLink>
        </ButtonContainer>
    </Container>
);
