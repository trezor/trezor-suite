import React from 'react';
import styled from 'styled-components';
import { Tooltip, Icon, useTheme } from '@trezor/components';

const InlineTooltip = styled(Tooltip)`
    display: inline-block;
    margin: 0 4px;
`;

type TooltipSymbolProps = {
    content: React.ReactNode;
};

const TooltipSymbol = ({ content }: TooltipSymbolProps) => {
    const theme = useTheme();
    return (
        <InlineTooltip content={content}>
            <Icon
                icon="QUESTION"
                color={theme.TYPE_LIGHT_GREY}
                hoverColor={theme.TYPE_DARK_GREY}
                size={14}
                useCursorPointer
            />
        </InlineTooltip>
    );
};

export default TooltipSymbol;
