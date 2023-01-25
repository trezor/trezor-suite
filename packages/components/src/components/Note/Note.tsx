import React from 'react';
import styled from 'styled-components';

import { Icon } from '../Icon';
import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';

const Row = styled.div`
    align-items: center;
    display: flex;
    gap: 6px;
`;

const P = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    margin-top: 2px;
`;

interface NoteProps {
    children: React.ReactNode;
    className?: string;
}

export const Note = ({ children, className }: NoteProps) => (
    <Row className={className}>
        <Icon icon="INFO" size={14} />
        <P>{children}</P>
    </Row>
);
