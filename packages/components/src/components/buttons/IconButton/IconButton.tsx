import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon } from '../../assets/Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';
import { IconType } from '../../../support/types';
import { ButtonContainer, ButtonProps } from '../Button/Button';
import { ButtonVariant, getIconColor, getIconSize, getPadding } from '../buttonStyleUtils';

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
    iconSize?: number;
    variant?: Exclude<ButtonVariant, 'danger'>;
    label?: React.ReactNode;
}

export const IconButton = ({
    icon,
    label,
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

    const Loader = <Spinner size={getIconSize(size)} strokeWidth={2} />;

    return (
        <IconButtonContainer
            variant={variant}
            size={size}
            disabled={isDisabled || isLoading}
            {...rest}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}

            {label && <Label isDisabled={isDisabled}>{label}</Label>}
        </IconButtonContainer>
    );
};
