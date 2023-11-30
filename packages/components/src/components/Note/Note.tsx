import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { Icon } from '../assets/Icon/Icon';
import { Paragraph } from '../typography/Paragraph/Paragraph';

const Row = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
`;

const InfoIcon = styled(Icon)`
    margin-top: 2px;
`;

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
            <InfoIcon icon="INFO" size={14} color={theme.textSubdued} />
            <StyledParagraph type="hint" $color={theme.textSubdued}>
                {children}
            </StyledParagraph>
        </Row>
    );
};
