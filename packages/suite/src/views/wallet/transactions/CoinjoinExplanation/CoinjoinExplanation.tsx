import styled from 'styled-components';
import { darken } from 'polished';

import { Card, Icon, variables } from '@trezor/components';
import { HELP_CENTER_COINJOIN_URL } from '@trezor/urls';
import { mediaQueries } from '@trezor/styles';

import { Translation } from 'src/components/suite';
import { CoinjoinProcessStep, CoinjoinProcessStepProps } from './CoinjoinProcessStep';
import { spacingsPx, typography } from '@trezor/theme';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

const Container = styled(Card)`
    background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: ${spacingsPx.md};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint};
`;

const QuestionIcon = styled(Icon)`
    margin-right: 4px;
`;

const Steps = styled(Card)`
    box-shadow: none;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.xl};

    ${mediaQueries.dark_theme} {
        background: ${({ theme }) => theme.backgroundSurfaceElevation3};
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: block;
    }
`;

const StyledLearnMoreButton = styled(LearnMoreButton)`
    margin: 0 auto;
    color: ${({ theme }) => theme.textSubdued};

    button {
        background: #d9d9d9;
    }

    path {
        fill: ${({ theme }) => theme.iconSubdued};
    }

    button:hover,
    button:focus {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, '#d9d9d9')};
    }

    ${mediaQueries.dark_theme} {
        button {
            background: ${({ theme }) => theme.backgroundSurfaceElevation0};
        }

        button:hover,
        button:focus {
            background: ${({ theme }) =>
                darken(theme.HOVER_DARKEN_FILTER, theme.backgroundSurfaceElevation0)};
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

        <StyledLearnMoreButton url={HELP_CENTER_COINJOIN_URL} />
    </Container>
);
