import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Card, Icon, variables } from '@trezor/components';
import { ArrowsInIcon, CoinsIcon, QuestionIcon, TrezorBackupIcon } from '@trezor/icons';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { CoinjoinProcessStep, type CoinjoinProcessStepProps } from './CoinjoinProcessStep';

const Heading = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: ${spacingsPx.md};
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']};
`;

const Steps = styled.div`
    box-shadow: none;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: space-between;
    margin-bottom: ${spacingsPx.xl};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: block;
    }
`;

const STEPS: Array<Omit<CoinjoinProcessStepProps, 'number'> & { id: string }> = [
    {
        id: 'coins',
        iconName: CoinsIcon,
        title: <Translation id="TR_COINJOIN_STEP_1_TITLE" />,
        description: <Translation id="TR_COINJOIN_STEP_1_DESCRIPTION" />,
    },
    {
        id: 'backup',
        iconName: TrezorBackupIcon,
        title: <Translation id="TR_START_COINJOIN" />,
        description: <Translation id="TR_COINJOIN_STEP_2_DESCRIPTION" />,
    },
    {
        id: 'arrows',
        iconName: ArrowsInIcon,
        title: <Translation id="TR_COINJOIN_STEP_3_TITLE" />,
        description: <Translation id="TR_COINJOIN_STEP_3_DESCRIPTION" />,
    },
];

export const CoinjoinExplanation = () => (
    <Card>
        <Heading>
            <Icon as={QuestionIcon} margin={{ right: spacings.xxs }} size={15} />
            <Translation id="TR_COINJOIN_EXPLANATION_TITLE" />
        </Heading>

        <Steps>
            {STEPS.map(({ id, ...step }, index) => (
                <CoinjoinProcessStep number={index + 1} key={id} {...step} />
            ))}
        </Steps>
    </Card>
);
