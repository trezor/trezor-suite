import React from 'react';
import styled from 'styled-components';
import { Icon, Tooltip, TooltipProps, colors, variables } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    font-weight: 600;
    font-size: ${variables.FONT_SIZE.TINY};
    text-transform: uppercase;
    align-items: center;
`;

const Text = styled.span`
    margin-right: 0.5ch;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    align-items: center;
`;

interface Props {
    children?: React.ReactNode;
    tooltipContent: TooltipProps['content'];
}

const ColHeader = ({ children, tooltipContent, ...rest }: Props) => {
    return (
        <Wrapper {...rest}>
            <Text>{children}</Text>
            <Tooltip maxWidth={285} placement="top" content={tooltipContent}>
                <StyledIcon
                    icon="INFO"
                    hoverColor={colors.BLACK0}
                    color={colors.BLACK50}
                    size={12}
                />
            </Tooltip>
        </Wrapper>
    );
};

export default ColHeader;
