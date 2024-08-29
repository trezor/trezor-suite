import { ReactNode } from 'react';
import styled, { useTheme } from 'styled-components';
import { Tooltip } from '../../Tooltip/Tooltip';
import { Button, ButtonProps } from '../Button/Button';
import { spacingsPx } from '@trezor/theme';
import { Icon } from '../../Icon/Icon';

const StyledButton = styled(Button)`
    position: relative;
    padding-inline: ${spacingsPx.xxl};
`;

const IconWrapper = styled.div`
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
                    <IconWrapper>
                        <Icon
                            name="info"
                            size={12}
                            color={
                                isDisabled ? theme.legacy.TYPE_LIGHT_GREY : theme.legacy.BG_WHITE
                            }
                        />
                    </IconWrapper>
                )}
                {children}
            </StyledButton>
        </Tooltip>
    );
};
