import { ReactNode } from 'react';
import styled from 'styled-components';

import { Tooltip, TooltipProps } from '@trezor/components';
import { typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    align-items: center;
    justify-content: center;
`;

const Text = styled.span`
    margin-right: 0.5ch;
    ${typography.label}
`;

interface ColHeaderProps {
    children?: ReactNode;
    tooltipContent?: TooltipProps['content'];
    tooltipOpenGuide?: TooltipProps['addon'];
}

export const ColHeader = ({
    children,
    tooltipContent,
    tooltipOpenGuide,
    ...rest
}: ColHeaderProps) => (
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
