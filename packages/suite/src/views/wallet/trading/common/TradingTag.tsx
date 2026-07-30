import styled from 'styled-components';

import { palette, typography } from '@trezor/theme';

const TagRow = styled.div`
    display: flex;
`;

const Tag = styled.div`
    padding: 2px 8px 0;
    border-radius: 4px;
    background: ${({ theme }) => theme.contentWarning};
    color: ${palette.globalWhiteAlpha1000};
    ${typography['body-xs']}
    text-transform: capitalize;
`;

interface TradingTagProps {
    tag?: string;
    className?: string;
}

export const TradingTag = ({ tag, className }: TradingTagProps) => (
    <TagRow className={className}>{tag && <Tag>{tag}</Tag>}</TagRow>
);
