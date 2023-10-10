import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon } from '../../assets/Icon/Icon';
import { Tooltip } from '../../Tooltip/Tooltip';
import { Button, ButtonProps } from '../Button/Button';

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
    tooltipContent: ReactNode;
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
