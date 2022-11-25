import React from 'react';
import styled from 'styled-components';

import { Icon, variables } from '@trezor/components';

const Wrapper = styled.div`
    align-items: center;
    display: flex;
    gap: 6px;
`;

const AnonymityLevel = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface UtxoAnonymityProps {
    anonymity: number;
}

export const UtxoAnonymity = ({ anonymity }: UtxoAnonymityProps) => (
    <Wrapper>
        <Icon icon="USERS" size={20} />
        <AnonymityLevel>{anonymity}</AnonymityLevel>
    </Wrapper>
);
