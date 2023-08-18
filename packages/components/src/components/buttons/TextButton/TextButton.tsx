import React from 'react';
import styled from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { ButtonProps, focusShadowStyle } from '../Button/Button';
import { ButtonSize, getIconSize, IconAlignment } from '../buttonStyleUtils';
import { Icon } from '../../assets/Icon/Icon';
import { Spinner } from '../../loaders/Spinner/Spinner';

const TextButtonContainer = styled.button<{
    size: ButtonSize;
    iconAlignment: IconAlignment;
    hasIcon: boolean;
}>`
    display: flex;
    align-items: center;
    flex-direction: ${({ iconAlignment }) => iconAlignment === 'right' && 'row-reverse'};
    gap: ${({ hasIcon }) => hasIcon && spacingsPx.xs};
    height: ${({ size }) => (size === 'small' ? 22 : 26)}px;
    padding: 4px;
    border-radius: ${borders.radii.xs};
    background: none;
    color: ${({ theme }) => theme.textPrimaryDefault};
    ${({ size }) => (size === 'small' ? typography.hint : typography.body)};
    white-space: nowrap;
    transition: border-color 0.1s ease-out, box-shadow 0.1s ease-out, color 0.1s ease-out;
    outline: none;
    cursor: pointer;

    ${focusShadowStyle}

    path {
        fill: ${({ theme }) => theme.iconPrimaryDefault};
        transition: fill 0.1s ease-out;
    }

    :hover {
        color: ${({ theme }) => theme.textPrimaryPressed};

        path {
            fill: ${({ theme }) => theme.iconPrimaryPressed};
        }
    }

    :disabled {
        color: ${({ theme }) => theme.textDisabled};
        cursor: default;

        path {
            fill: ${({ theme }) => theme.iconDisabled};
        }
    }
`;

export interface TextButtonProps extends Omit<ButtonProps, 'isFullWidth' | 'iconSize' | 'variant'> {
    children: React.ReactNode;
}

export const TextButton = ({
    icon,
    iconAlignment = 'left',
    size = 'large',
    isDisabled = false,
    isLoading = false,
    children,
    ...rest
}: TextButtonProps) => {
    const IconComponent = icon ? <Icon icon={icon} size={getIconSize(size)} /> : null;

    const Loader = <Spinner size={getIconSize(size)} />;

    return (
        <TextButtonContainer
            hasIcon={!!icon}
            size={size}
            iconAlignment={iconAlignment}
            disabled={isDisabled || isLoading}
            {...rest}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}

            {children}
        </TextButtonContainer>
    );
};
