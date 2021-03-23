import React from 'react';
import styled from 'styled-components';
import { Tooltip, TooltipProps, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    align-items: center;
    justify-content: center;
`;

const Text = styled.span`
    margin-right: 0.5ch;
    font-weight: 600;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
`;

interface Props {
    children?: React.ReactNode;
    tooltipContent?: TooltipProps['content'];
}

const ColHeader = ({ children, tooltipContent, ...rest }: Props) => (
    <Wrapper {...rest}>
        {tooltipContent ? (
            <Tooltip maxWidth={285} content={tooltipContent} dashed>
                <Text>{children}</Text>
            </Tooltip>
        ) : (
            <Text>{children}</Text>
        )}
    </Wrapper>
);

export default ColHeader;
