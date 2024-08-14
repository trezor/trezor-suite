import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon } from '../../Icon/Icon';
import { Tooltip } from '../../Tooltip/Tooltip';
import { Button, ButtonProps } from '../Button/Button';
import { spacingsPx } from '@trezor/theme';

const StyledButton = styled(Button)`
    position: relative;
    padding-inline: ${spacingsPx.xxl};
`;

const InfoIcon = styled(Icon)`
    position: absolute;
    top: ${spacingsPx.xxs};
    right: ${spacingsPx.xxs};
`;

export interface TooltipButtonProps extends ButtonProps {
    tooltipContent: ReactNode;
}

export const TooltipButton = ({
    tooltipContent,
    isDisabled = false,
    children,
    ...buttonProps
}: TooltipButtonProps) => {
    const theme = useTheme();

    return (
        <Tooltip maxWidth={285} content={tooltipContent}>
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
