import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { H3, Icon, IconVariant, Paragraph, Row, Text, TextVariant } from '@trezor/components';
import { borders, spacings, spacingsPx, typographyStylesBase } from '@trezor/theme';

import { Translation } from 'src/components/suite';

const Step = styled.div`
    display: grid;
    align-items: center;
    gap: 0 ${spacingsPx.sm};
    grid-template: auto auto / min-content auto;
`;

const StepNumber = styled.div<{ $subdued?: boolean; $isDone?: boolean }>`
    border: ${borders.widths.large} solid ${({ theme }) => theme.borderElevation2};
    border-radius: ${borders.radii.full};
    padding: ${spacingsPx.xxs};

    background-color: ${({ theme, $isDone }) =>
        $isDone === true ? theme.backgroundPrimarySubtleOnElevation1 : undefined};

    color: ${({ theme, $subdued }) => ($subdued === true ? theme.textSubdued : undefined)};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledParagraph = styled(Paragraph)`
    font-variant-numeric: tabular-nums;
    text-align: center;
    width: ${typographyStylesBase.highlight.lineHeight}px;
`;

const Line = styled.div`
    border-left: ${borders.widths.large} dashed ${({ theme }) => theme.borderElevation2};
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
                  margin-bottom: ${spacingsPx.xxxl};
              `}
`;

export interface BackupInstructionsStepProps {
    children: ReactNode;
    description?: TranslationKey;
    heading: TranslationKey;
    isLast: boolean;
    stepNumber: number;
    time: number;
    completeness?: 'todo' | 'done';
}

export const BackupInstructionsStep = ({
    children,
    description,
    heading,
    isLast,
    stepNumber,
    time,
    completeness,
}: BackupInstructionsStepProps) => {
    const variantMap: Record<'todo' | 'done', TextVariant & IconVariant> = {
        todo: 'tertiary',
        done: 'primary',
    };

    const variant = completeness !== undefined ? variantMap[completeness] : undefined;

    return (
        <Step>
            <StepNumber $subdued={completeness === 'todo'} $isDone={completeness === 'done'}>
                {completeness === 'done' ? (
                    <Icon name="check" variant="primary" size={24} />
                ) : (
                    <StyledParagraph typographyStyle="highlight">{stepNumber}</StyledParagraph>
                )}
            </StepNumber>
            <Row gap={spacings.sm}>
                <H3>
                    <Text variant={variant}>
                        <Translation id={heading} />
                    </Text>
                </H3>
                {completeness === 'done' ? null : (
                    <Row gap={spacings.xxs}>
                        <Icon name="timer" variant={variant ?? 'tertiary'} size={16} />
                        <Text typographyStyle="hint" variant={variant ?? 'tertiary'}>
                            <Translation id="TR_N_MIN" values={{ n: time }} />
                        </Text>
                    </Row>
                )}
            </Row>
            {!isLast && <Line />}

            <Body $isLast={isLast}>
                {description ? (
                    <Text typographyStyle="hint" variant="tertiary">
                        <Translation id={description} />
                    </Text>
                ) : null}
                {children}
            </Body>
        </Step>
    );
};
