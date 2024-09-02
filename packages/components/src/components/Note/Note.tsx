import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';

import { spacings, spacingsPx } from '@trezor/theme';

import { Paragraph } from '../typography/Paragraph/Paragraph';
import { Icon } from '../Icon/Icon';

const Row = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledParagraph = styled(Paragraph)<{ $color?: string }>`
    color: ${({ $color }) => $color};
`;

export interface NoteProps {
    children: ReactNode;
    className?: string;
}

export const Note = ({ children, className }: NoteProps) => {
    const theme = useTheme();

    return (
        <Row className={className}>
            <Icon name="info" size={14} color={theme.textSubdued} margin={{ top: spacings.xxxs }} />
            <StyledParagraph typographyStyle="hint" $color={theme.textSubdued}>
                {children}
            </StyledParagraph>
        </Row>
    );
};
