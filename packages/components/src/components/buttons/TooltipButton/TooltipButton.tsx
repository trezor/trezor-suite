import React from 'react';
import styled from 'styled-components';
import { Icon } from '../../Icon';
import { Tooltip } from '../../Tooltip';
import { Button, ButtonProps } from '../Button/Button';
import { useTheme } from '../../../utils';

const StyledButton = styled(Button)`
    position: relative;
    padding-left: 32px;
    padding-right: 32px;
`;

const InfoIcon = styled(Icon)`
    position: absolute;
    top: 4px;
    right: 4px;
`;

export interface TooltipButtonProps extends ButtonProps {
    interactiveTooltip?: boolean;
    tooltipContent: React.ReactNode;
}

export const TooltipButton = ({
    tooltipContent,
    interactiveTooltip = false,
    isDisabled,
    children,
    ...buttonProps
}: TooltipButtonProps) => {
    const theme = useTheme();

    return (
        <Tooltip maxWidth={285} content={tooltipContent} interactive={interactiveTooltip}>
            <StyledButton isDisabled={isDisabled} {...buttonProps}>
                {tooltipContent && (
                    <InfoIcon
                        icon="INFO"
                        size={12}
                        color={isDisabled ? theme.TYPE_LIGHT_GREY : theme.BG_WHITE}
                    />
                )}
                {children}
            </StyledButton>
        </Tooltip>
    );
};
