import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    H3,
    IconCircle,
    type IconName,
    Paragraph,
    useMediaQuery,
    variables,
} from '@trezor/components';
import { belowBreakpoint, breakpoints, spacings } from '@trezor/theme';

const Image = styled.div`
    margin: -8px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 1;
        grid-row: 1/3;
        margin: 0;
    }
`;

const StepNumberSlot = styled.div`
    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 1;
    }
`;

const StepTitleSlot = styled.div`
    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        align-self: center;
        grid-column: 2;
        grid-row: 1;
    }
`;

const StepDescriptionSlot = styled.div`
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
}: CoinjoinProcessStepProps) => {
    const isBelowLaptop = useMediaQuery(belowBreakpoint(breakpoints.laptop));

    return (
        <Container>
            <Image>
                <IconCircle name={iconName} size={96} />
            </Image>
            <StepNumberSlot>
                <Paragraph
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="secondary"
                    margin={{ top: spacings.xl, bottom: 6 }}
                >
                    <Translation id="TR_STEP" values={{ number }} />
                </Paragraph>
            </StepNumberSlot>
            <StepTitleSlot>
                <H3
                    typographyStyle={isBelowLaptop ? 'body-md-strong' : 'headline-sm'}
                    margin={{ bottom: spacings.lg }}
                >
                    {title}
                </H3>
            </StepTitleSlot>
            <StepDescriptionSlot>
                <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                    {description}
                </Paragraph>
            </StepDescriptionSlot>
        </Container>
    );
};
