import styled from 'styled-components';
import { variables } from '@trezor/components';
import { borders } from '@trezor/theme';

const TagRow = styled.div`
    display: flex;
`;

const Tag = styled.div`
    padding: 3px 8px 0;
    border-radius: ${borders.radii.xs};
    background: ${({ theme }) => theme.TYPE_ORANGE};
    color: ${({ theme }) => theme.TYPE_WHITE};
    font-size: ${variables.FONT_SIZE.TINY};
    line-height: 21px;
    text-transform: capitalize;
`;

interface CoinmarketTagProps {
    tag?: string;
    className?: string;
}

export const CoinmarketTag = ({ tag, className }: CoinmarketTagProps) => (
    <TagRow className={className}>{tag && <Tag>{tag}</Tag>}</TagRow>
);
