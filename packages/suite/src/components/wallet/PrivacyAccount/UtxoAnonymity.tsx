import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Icon, variables } from '@trezor/components';

const Wrapper = styled.div`
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    gap: 6px;
`;

interface UtxoAnonymityProps {
    anonymity: number;
}

export const UtxoAnonymity = ({ anonymity }: UtxoAnonymityProps) => (
    <Wrapper>
        <Icon icon="USERS" size={20} />
        <Translation id="TR_COINJOIN_ANONYMITY_LEVEL_INDICATOR" values={{ anonymity }} />
    </Wrapper>
);
