import React from 'react';
import styled, { useTheme } from 'styled-components';

import { Icon } from '../Icon';
import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';

const Row = styled.div`
    display: flex;
    gap: 6px;
`;

const InfoIcon = styled(Icon)`
    margin-top: 1px;
`;

const Text = styled.div<{ $color?: string }>`
    color: ${({ $color }) => $color};
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

interface NoteProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
}

export const Note = ({ children, className, color }: NoteProps) => {
    const theme = useTheme();

    const noteColor = color || theme.TYPE_LIGHT_GREY;

    return (
        <Row className={className}>
            <InfoIcon icon="INFO" size={14} color={noteColor} />
            <Text $color={noteColor}>{children}</Text>
        </Row>
    );
};
