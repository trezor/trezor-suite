import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { H3, Icon, Paragraph, Text } from '@trezor/components';
import { borders, spacingsPx, typographyStylesBase } from '@trezor/theme';

import { Translation } from 'src/components/suite';

const Step = styled.div`
    display: grid;
    align-items: center;
    gap: 0 ${spacingsPx.sm};
    grid-template: auto auto / min-content auto;
`;

const StepNumber = styled.div`
    border: ${borders.widths.medium} solid ${({ theme }) => theme.borderElevationNegative};
    border-radius: ${borders.radii.full};
    padding: ${spacingsPx.xxs};
`;

const StyledParagraph = styled(Paragraph)`
    font-variant-numeric: tabular-nums;
    text-align: center;
    width: ${typographyStylesBase.highlight.lineHeight}px;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
`;

const HeadingRow = styled(Row)`
    gap: ${spacingsPx.sm};
`;

const TimerRow = styled(Row)`
    gap: ${spacingsPx.xxs};
`;

const Line = styled.div`
    border-left: ${borders.widths.medium} dashed ${({ theme }) => theme.borderElevationNegative};
    place-self: stretch center;
`;

const Body = styled.div<{ $isLast: boolean }>`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
    ${({ $isLast }) =>
        $isLast
            ? css`
                  /* This is necessary when Line is not rendered and its cell must be empty */
                  grid-column-start: 2;
                  grid-row-start: 2;
              `
            : css`
                  /* This cannot be done with gap because Line needs to reach the following step */
                  margin-bottom: ${spacingsPx.lg};
              `}
`;

export interface BackupInstructionsStepProps {
    children: ReactNode;
    description: TranslationKey;
    heading: TranslationKey;
    isLast: boolean;
    stepNumber: number;
    time: number;
}

export const BackupInstructionsStep = ({
    children,
    description,
    heading,
    isLast,
    stepNumber,
    time,
}: BackupInstructionsStepProps) => (
    <Step>
        <StepNumber>
            <StyledParagraph typographyStyle="highlight">{stepNumber}</StyledParagraph>
        </StepNumber>
        <HeadingRow>
            <H3>
                <Translation id={heading} />
            </H3>
            <TimerRow>
                <Icon icon="TIMER" variant="tertiary" size={16} />
                <Text typographyStyle="hint" variant="tertiary">
                    <Translation id="TR_N_MIN" values={{ n: time }} />
                </Text>
            </TimerRow>
        </HeadingRow>
        {!isLast && <Line />}
        <Body $isLast={isLast}>
            <Text typographyStyle="hint" variant="tertiary">
                <Translation id={description} />
            </Text>
            {children}
        </Body>
    </Step>
);
