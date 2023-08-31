import React from 'react';
import styled from 'styled-components';
import { Tooltip, TooltipProps, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    align-items: center;
    justify-content: center;
`;

const Text = styled.span`
    margin-right: 0.5ch;
    font-weight: 600;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
`;

interface ColHeaderProps {
    children?: React.ReactNode;
    tooltipContent?: TooltipProps['content'];
    tooltipOpenGuide?: TooltipProps['addon'];
}

const ColHeader = ({ children, tooltipContent, tooltipOpenGuide, ...rest }: ColHeaderProps) => (
    <Wrapper {...rest}>
        {tooltipContent ? (
            <Tooltip maxWidth={285} content={tooltipContent} addon={tooltipOpenGuide} dashed>
                <Text>{children}</Text>
            </Tooltip>
        ) : (
            <Text>{children}</Text>
        )}
    </Wrapper>
);

export default ColHeader;
