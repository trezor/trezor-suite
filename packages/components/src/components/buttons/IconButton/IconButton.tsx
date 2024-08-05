import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon, IconType } from '../../Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { ButtonContainer, ButtonProps } from '../Button/Button';
import { ButtonVariant, getIconColor, getIconSize, getPadding } from '../buttonStyleUtils';
import { TOOLTIP_DELAY_NONE, TOOLTIP_DELAY_SHORT } from '../../Tooltip/TooltipDelay';
import { Tooltip } from '../../Tooltip/Tooltip';

const IconButtonContainer = styled(ButtonContainer)`
    position: relative;
    padding: ${({ $size }) => getPadding($size, false)};
    ${({ $borderRadius }) => $borderRadius && `border-radius: ${$borderRadius};`};
    ${({ $width }) => $width && `width: ${$width};`};
    ${({ $height }) => $height && `height: ${$height};`};
`;

const Label = styled.span<{ $isDisabled: boolean }>`
    position: absolute;
    bottom: -22px;
    color: ${({ theme, $isDisabled }) => ($isDisabled ? theme.textDisabled : theme.textSubdued)};
    white-space: nowrap;
`;

export interface IconButtonProps
    extends Omit<
        ButtonProps,
        'isFullWidth' | 'iconAlignment' | 'iconSize' | 'variant' | 'children'
    > {
    icon: IconType;
    label?: React.ReactNode;
    iconSize?: number;
    variant?: ButtonVariant;
    bottomLabel?: React.ReactNode;
}

export const IconButton = ({
    icon,
    label = null,
    bottomLabel,
    variant = 'primary',
    size = 'large',
    iconSize,
    isDisabled = false,
    isLoading = false,
    onClick,
    isSubtle = false,
    ...rest
}: IconButtonProps) => {
    const theme = useTheme();

    const IconComponent = (
        <Icon
            icon={icon}
            size={iconSize || getIconSize(size)}
            color={getIconColor({ variant, isDisabled, theme, isSubtle })}
        />
    );

    const Loader = <Spinner size={getIconSize(size)} />;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick === undefined) return;
        onClick(e);
        e.stopPropagation();
    };

    return (
        <Tooltip
            content={label}
            delayShow={TOOLTIP_DELAY_SHORT}
            delayHide={TOOLTIP_DELAY_NONE}
            cursor="default"
        >
            <IconButtonContainer
                $variant={variant}
                $size={size}
                disabled={isDisabled || isLoading}
                onClick={handleClick}
                $isSubtle={isSubtle}
                $borderRadius={rest.borderRadius}
                $width={rest.width}
                $height={rest.height}
                {...rest}
            >
                {isLoading && Loader}
                {!isLoading && icon && IconComponent}

                {bottomLabel && <Label $isDisabled={isDisabled}>{bottomLabel}</Label>}
            </IconButtonContainer>
        </Tooltip>
    );
};
