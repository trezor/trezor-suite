import { ReactNode } from 'react';
import styled from 'styled-components';
import { Icon, IconName, Tooltip } from '@trezor/components';

// eslint-disable-next-line local-rules/no-override-ds-component
const InlineTooltip = styled(Tooltip)`
    display: inline-block;
    margin: 0 4px;
`;

type TooltipSymbolProps = {
    content: ReactNode;
    icon?: IconName;
    iconColor?: string;
    className?: string;
};

const TooltipSymbol = ({
    content,
    icon = 'question',
    iconColor,
    className,
}: TooltipSymbolProps) => (
    <InlineTooltip content={content} maxWidth={250} className={className}>
        <Icon name={icon} size={16} color={iconColor} />
    </InlineTooltip>
);

export default TooltipSymbol;
