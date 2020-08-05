import React from 'react';
import styled from 'styled-components';
import { Icon, Tooltip, TooltipProps, colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    align-items: center;
    justify-content: center;
`;

const Text = styled.span`
    margin-right: 0.5ch;
    font-weight: 600;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    align-items: center;
`;

interface Props {
    children?: React.ReactNode;
    tooltipContent?: TooltipProps['content'];
}

const ColHeader = ({ children, tooltipContent, ...rest }: Props) => {
    return (
        <Wrapper {...rest}>
            <Text>{children}</Text>
            {tooltipContent && (
                <Tooltip maxWidth={285} placement="top" content={tooltipContent}>
                    <StyledIcon icon="INFO_ACTIVE" color={colors.NEUE_TYPE_LIGHT_GREY} size={16} />
                </Tooltip>
            )}
        </Wrapper>
    );
};

export default ColHeader;
