import React from 'react';

import styled, { useTheme } from 'styled-components';

import { borders, spacingsPx, typography } from '@trezor/theme';

import { pickAndPrepareFrameProps, withFrameProps } from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { Spinner } from '../../loaders/Spinner/Spinner';
import {
    AllowedButtonFrameProps,
    ButtonProps,
    allowedButtonFrameProps,
    getIcon,
} from '../Button/Button';
import {
    ButtonSize,
    ButtonVariant,
    IconAlignment,
    getIconColor,
    getIconSize,
} from '../buttonStyleUtils';

const mapVariantToColor: Record<ButtonVariant, string> = {
    primary: 'textPrimaryDefault',
    tertiary: 'textSubdued',
    info: 'textAlertBlue',
    warning: 'textAlertYellow',
    destructive: 'textAlertRed',
};

const mapVariantToHoverColor: Record<ButtonVariant, string> = {
    primary: 'textPrimaryPressed',
    tertiary: 'textPrimaryPressed',
    info: 'textPrimaryPressed',
    warning: 'textPrimaryPressed',
    destructive: 'textPrimaryPressed',
};

const TextButtonContainer = styled.button<
    TransientProps<AllowedButtonFrameProps> & {
        $size: ButtonSize;
        $iconAlignment: IconAlignment;
        $variant: ButtonVariant;
        $isUnderlined: boolean;
    }
>`
    display: flex;
    align-items: center;
    flex-direction: ${({ $iconAlignment }) => $iconAlignment === 'end' && 'row-reverse'};
    gap: ${spacingsPx.xs};
    height: ${({ $size: size }) => (size === 'small' ? 22 : 26)}px;
    padding: ${spacingsPx.xxs};
    border: 1px solid transparent;
    border-radius: ${borders.radii.xxs};
    background: none;
    color: ${({ theme, $variant }) => theme[mapVariantToColor[$variant]]};

    ${({ $size }) => ($size === 'small' ? typography.hint : typography.body)};
    white-space: nowrap;
    transition:
        ${focusStyleTransition},
        color 0.1s ease-out;
    outline: none;
    cursor: pointer;

    ${({ $isUnderlined }) => $isUnderlined && 'text-decoration: underline;'}

    ${getFocusShadowStyle()}
    ${withFrameProps}

    &:hover {
        color: ${({ theme, $variant }) => theme[mapVariantToHoverColor[$variant]]};

        path {
            fill: ${({ theme, $variant }) => theme[mapVariantToHoverColor[$variant]]};
        }
    }

    &:disabled {
        color: ${({ theme }) => theme.textDisabled};
        cursor: not-allowed;

        path {
            fill: ${({ theme }) => theme.iconDisabled};
        }
    }
`;

export type TextButtonProps = Omit<ButtonProps, 'iconSize' | 'isSubtle' | 'children'> & {
    children?: React.ReactNode;
    isUnderlined?: boolean;
};

export const TextButton = ({
    icon,
    iconAlignment = 'start',
    size = 'large',
    isDisabled = false,
    isUnderlined = false,
    isLoading = false,
    children,
    variant = 'primary',
    ...rest
}: TextButtonProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedButtonFrameProps);
    const theme = useTheme();
    const IconComponent = getIcon({
        icon,
        size: getIconSize(size),
        color: getIconColor({ variant, isDisabled, theme, isSubtle: true }),
    });

    const Loader = <Spinner size={getIconSize(size)} />;

    return (
        <TextButtonContainer
            $size={size}
            $iconAlignment={iconAlignment}
            disabled={isDisabled || isLoading}
            $variant={variant}
            $isUnderlined={isUnderlined}
            {...frameProps}
            {...rest}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}
            {children}
        </TextButtonContainer>
    );
};
