import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { H3, IconCircle, type IconName, Paragraph, variables } from '@trezor/components';
import { typography } from '@trezor/theme';

const Image = styled.div`
    margin: -8px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 1;
        grid-row: 1/3;
        margin: 0;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StepNumber = styled(Paragraph)`
    margin: 24px 0 6px;
    color: ${({ theme }) => theme.textSubdued};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 1;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StepTitle = styled(H3)`
    margin-bottom: 20px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        align-self: center;
        ${typography['body-md-strong']}
        grid-column: 2;
        grid-row: 1;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StepDescription = styled(Paragraph)`
    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 2;
    }
`;

const Container = styled.div`
    position: relative;
    max-width: 220px;

    & + & {
        margin-left: 15px;

        &::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: -15px;
            width: 1px;
            height: 130px;
        }
    }

    &:not(:last-child) {
        margin-right: 15px;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: grid;
        grid-template-columns: 50px auto;
        gap: 0 14px;
        max-width: unset;

        &:not(:last-child) {
            margin-right: 0;
            margin-bottom: 26px;
        }

        & + & {
            margin-left: 0;

            &::before {
                content: none;
            }
        }
    }
`;

export interface CoinjoinProcessStepProps {
    number: number;
    iconName: IconName;
    title: ReactNode;
    description: ReactNode;
}

export const CoinjoinProcessStep = ({
    number,
    iconName,
    title,
    description,
}: CoinjoinProcessStepProps) => (
    <Container>
        <Image>
            <IconCircle name={iconName} size={96} />
        </Image>
        <StepNumber typographyStyle="body-sm">
            <Translation id="TR_STEP" values={{ number }} />
        </StepNumber>
        <StepTitle>{title}</StepTitle>
        <StepDescription typographyStyle="body-md" intent="neutral" priority="secondary">
            {description}
        </StepDescription>
    </Container>
);
