import styled from 'styled-components';

import { Icon } from '@trezor/components';
import { typography } from '@trezor/theme';

const Wrapper = styled.div`
    align-items: center;
    display: flex;
    gap: 6px;
`;

const AnonymityLevel = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
    font-variant-numeric: tabular-nums;
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
