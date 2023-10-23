import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';

import { Icon } from '../assets/Icon/Icon';
import { typography } from '@trezor/theme';

const Row = styled.div`
    display: flex;
    gap: 6px;
`;

const InfoIcon = styled(Icon)`
    margin-top: 1px;
`;

const Text = styled.div<{ $color?: string }>`
    color: ${({ $color }) => $color};
    ${typography.hint}
`;

export interface NoteProps {
    children: ReactNode;
    className?: string;
    color?: string;
}

export const Note = ({ children, className, color }: NoteProps) => {
    const theme = useTheme();

    const noteColor = color || theme.backgroundSurfaceElevation1;

    return (
        <Row className={className}>
            <InfoIcon icon="INFO" size={14} color={noteColor} />
            <Text $color={noteColor}>{children}</Text>
        </Row>
    );
};
