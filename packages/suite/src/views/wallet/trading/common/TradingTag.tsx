import styled from 'styled-components';

import { borders, paletteV2, typography } from '@trezor/theme';

const TagRow = styled.div`
    display: flex;
`;

const Tag = styled.div`
    padding: 3px 8px 0;
    border-radius: ${borders.radii.xs};
    background: ${({ theme }) => theme.contentWarning};
    color: ${paletteV2.globalWhiteAlpha1000};
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
