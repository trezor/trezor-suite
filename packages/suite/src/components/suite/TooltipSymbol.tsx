import { ReactNode } from 'react';
import styled from 'styled-components';
import { Tooltip, IconLegacy, IconLegacyType } from '@trezor/components';

const InlineTooltip = styled(Tooltip)`
    display: inline-block;
    margin: 0 4px;
`;

type TooltipSymbolProps = {
    content: ReactNode;
    icon?: IconLegacyType;
    iconColor?: string;
    className?: string;
};

const TooltipSymbol = ({
    content,
    icon = 'QUESTION',
    iconColor,
    className,
}: TooltipSymbolProps) => (
    <InlineTooltip content={content} maxWidth={250} className={className}>
        <IconLegacy icon={icon} size={16} color={iconColor} />
    </InlineTooltip>
);

export default TooltipSymbol;
