import React from 'react';
import styled from 'styled-components';
import { Tooltip, Icon } from '@trezor/components';

const InlineTooltip = styled(Tooltip)`
    display: inline-block;
    margin: 0 4px;
`;

type TooltipSymbolProps = {
    content: React.ReactNode;
};

const TooltipSymbol = ({ content }: TooltipSymbolProps) => (
    <InlineTooltip content={content}>
        <Icon icon="QUESTION" size={16} />
    </InlineTooltip>
);

export default TooltipSymbol;
