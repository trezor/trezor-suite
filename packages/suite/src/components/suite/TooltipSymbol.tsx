import { ReactNode } from 'react';
import styled from 'styled-components';
import { Tooltip, Icon, IconType } from '@trezor/components';

const InlineTooltip = styled(Tooltip)`
    display: inline-block;
    margin: 0 4px;
`;

type TooltipSymbolProps = {
    content: ReactNode;
    icon?: IconType;
};

const TooltipSymbol = ({ content, icon = 'QUESTION' }: TooltipSymbolProps) => (
    <InlineTooltip content={content} maxWidth={250}>
        <Icon icon={icon} size={16} />
    </InlineTooltip>
);

export default TooltipSymbol;
