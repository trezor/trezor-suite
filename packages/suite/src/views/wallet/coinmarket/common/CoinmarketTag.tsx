import styled from 'styled-components';
import { variables } from '@trezor/components';

const TagRow = styled.div`
    display: flex;
`;

const Tag = styled.div`
    margin: 0 16px 2px;
    padding: 3px 8px 0;
    border-radius: 8px;
    background: ${({ theme }) => theme.TYPE_ORANGE};
    color: ${({ theme }) => theme.TYPE_WHITE};
    font-size: ${variables.FONT_SIZE.TINY};
    line-height: 21px;
    text-transform: uppercase;
`;

interface CoinmarketTagProps {
    tag?: string;
}

export const CoinmarketTag = ({ tag }: CoinmarketTagProps) => (
    <TagRow>{tag && <Tag>{tag}</Tag>}</TagRow>
);
