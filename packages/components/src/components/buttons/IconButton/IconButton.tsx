import React from 'react';

import { useTheme } from 'styled-components';

import { FrameProps, FramePropsKeys } from '../../../utils/frameProps';
import { useElevation } from '../../ElevationContext/ElevationContext';
import { Tooltip } from '../../Tooltip/Tooltip';
import { TOOLTIP_DELAY_NONE, TOOLTIP_DELAY_SHORT } from '../../Tooltip/TooltipDelay';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { ButtonContainer, ButtonProps, IconOrComponent, getIcon } from '../Button/Button';
import { ButtonVariant, getIconColor, getIconSize } from '../buttonStyleUtils';

export const allowedIconButtonFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconButtonFrameProps)[number]>;

export type IconButtonProps = AllowedFrameProps &
    Omit<
        ButtonProps,
        'icon' | 'isFullWidth' | 'iconAlignment' | 'iconSize' | 'variant' | 'children'
    > & {
        icon: IconOrComponent;
        label?: React.ReactNode;
        iconSize?: number;
        variant?: ButtonVariant;
    };

export const IconButton = ({
    icon,
    label = null,
    variant = 'primary',
    size = 'large',
    iconSize,
    isDisabled = false,
    isLoading = false,
    onClick,
    isSubtle = false,
    margin,
    ...rest
}: IconButtonProps) => {
    const theme = useTheme();

    const IconComponent = getIcon({
        icon,
        size: iconSize || getIconSize(size),
        color: getIconColor({ variant, isDisabled, theme, isSubtle }),
    });

    const Loader = <Spinner size={getIconSize(size)} />;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick === undefined) return;
        onClick(e);
        e.stopPropagation();
    };

    const { elevation } = useElevation();

    return (
        <Tooltip
            content={label}
            delayShow={TOOLTIP_DELAY_SHORT}
            delayHide={TOOLTIP_DELAY_NONE}
            cursor="default"
        >
            <ButtonContainer
                $variant={variant}
                $size={size}
                $hasLabel={false}
                disabled={isDisabled || isLoading}
                onClick={handleClick}
                $isSubtle={isSubtle}
                $elevation={elevation}
                $margin={margin}
                {...rest}
            >
                {!isLoading && icon && IconComponent}
                {isLoading && Loader}
            </ButtonContainer>
        </Tooltip>
    );
};
