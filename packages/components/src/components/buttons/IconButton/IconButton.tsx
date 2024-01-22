import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon, IconType } from '../../assets/Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { ButtonContainer, ButtonProps } from '../Button/Button';
import { ButtonVariant, getIconColor, getIconSize, getPadding } from '../buttonStyleUtils';
import { Tooltip } from '../../Tooltip/Tooltip';

const IconButtonContainer = styled(ButtonContainer)`
    position: relative;
    padding: ${({ size }) => getPadding(size, false)};
`;

const Label = styled.span<{ isDisabled: boolean }>`
    position: absolute;
    bottom: -22px;
    color: ${({ theme, isDisabled }) => (isDisabled ? theme.textDisabled : theme.textSubdued)};
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
    variant?: Exclude<ButtonVariant, 'danger'>;
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
    ...rest
}: IconButtonProps) => {
    const theme = useTheme();

    const IconComponent = (
        <Icon
            icon={icon}
            size={iconSize || getIconSize(size)}
            color={getIconColor(variant, isDisabled, theme)}
        />
    );

    const Loader = <Spinner size={getIconSize(size)} />;

    return (
        <Tooltip content={label} delay={[600, 0]} cursor="default">
            <IconButtonContainer
                variant={variant}
                size={size}
                disabled={isDisabled || isLoading}
                {...rest}
            >
                {!isLoading && icon && IconComponent}
                {isLoading && Loader}

                {bottomLabel && <Label isDisabled={isDisabled}>{bottomLabel}</Label>}
            </IconButtonContainer>
        </Tooltip>
    );
};
