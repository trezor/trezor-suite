import styled from 'styled-components';

import { Icon, variables } from '@trezor/components';

const Wrapper = styled.div`
    align-items: center;
    display: flex;
    gap: 6px;
`;

const AnonymityLevel = styled.span`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-variant-numeric: tabular-nums;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface UtxoAnonymityProps {
    anonymity: number; // float
}

export const UtxoAnonymity = ({ anonymity }: UtxoAnonymityProps) => (
    <Wrapper>
        <Icon name="users" size={20} />
        <AnonymityLevel>{Math.floor(anonymity)}</AnonymityLevel>
    </Wrapper>
);
