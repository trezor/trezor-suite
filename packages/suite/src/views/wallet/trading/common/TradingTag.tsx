import styled from 'styled-components';

import { variables } from '@trezor/components';
import { borders, paletteV2 } from '@trezor/theme';

const TagRow = styled.div`
    display: flex;
`;

const Tag = styled.div`
    padding: 3px 8px 0;
    border-radius: ${borders.radii.xs};
    background: ${({ theme }) => theme.textAlertYellow};
    color: ${paletteV2.globalWhiteAlpha1000};
    font-size: ${variables.FONT_SIZE.TINY};
    line-height: 21px;
    text-transform: capitalize;
`;

interface TradingTagProps {
    tag?: string;
    className?: string;
}

export const TradingTag = ({ tag, className }: TradingTagProps) => (
    <TagRow className={className}>{tag && <Tag>{tag}</Tag>}</TagRow>
);
