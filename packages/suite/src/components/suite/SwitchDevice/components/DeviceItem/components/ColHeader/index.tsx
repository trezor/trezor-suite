import React from 'react';
import styled from 'styled-components';
import { Icon, Tooltip, TooltipProps, useTheme, variables } from '@trezor/components';

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

const ColHeader = ({ children, tooltipContent, ...rest }: Props) => {
    const theme = useTheme();
    return (
        <Wrapper {...rest}>
            <Text>{children}</Text>
            {tooltipContent && (
                <Tooltip maxWidth={285} placement="top" content={tooltipContent}>
                    <Icon
                        icon="INFO_ACTIVE"
                        color={theme.TYPE_LIGHT_GREY}
                        size={16}
                        useCursorPointer
                    />
                </Tooltip>
            )}
        </Wrapper>
    );
};

export default ColHeader;
