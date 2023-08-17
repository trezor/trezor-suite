import { ButtonHTMLAttributes } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { Icon } from '../../assets/Icon/Icon';
import { IconType } from '../../../support/types';
import { Spinner } from '../../loaders/Spinner/Spinner';
import {
    ButtonSize,
    ButtonVariant,
    getIconColor,
    getIconSize,
    getPadding,
    getVariantStyle,
    IconAlignment,
} from '../buttonStyleUtils';

interface ButtonContainerProps {
    variant: ButtonVariant;
    size: ButtonSize;
    alignIcon?: IconAlignment;
    hasLabel?: boolean;
    hasIcon?: boolean;
    fullWidth?: boolean;
}

export const focusShadowStyle = css`
    border: 1px solid transparent;

    :focus-visible {
        border-color: ${({ theme }) => theme.backgroundAlertBlueBold};
        box-shadow: 0px 0px 0px 3px rgba(0, 120, 172, 0.25);
    }
`;

export const ButtonContainer = styled.button<ButtonContainerProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${({ alignIcon }) => alignIcon === 'right' && 'row-reverse'};
    gap: ${({ hasIcon }) => hasIcon && spacingsPx.xs};
    padding: ${({ size, hasLabel }) => getPadding(size, hasLabel)};
    width: ${({ fullWidth }) => fullWidth && '100%'};
    border-radius: ${borders.radii.full};
    transition: border-color 0.1s ease-out, box-shadow 0.1s ease-out, background 0.1s ease-out;
    outline: none;
    cursor: pointer;

    ${focusShadowStyle}

    ${({ variant, theme }) => getVariantStyle(variant, theme)}

    :disabled {
        background: ${({ theme }) => theme.BG_GREY};
        color: ${({ theme }) => theme.textDisabled};
        pointer-events: none;
        cursor: default;
    }
`;

interface ContentProps {
    size: ButtonSize;
    disabled: boolean;
}

const Content = styled.span<ContentProps>`
    height: ${({ size }) => (size === 'small' ? 20 : 24)}px;
    white-space: nowrap;

    ${({ size }) => (size === 'small' ? typography.hint : typography.body)};
`;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    buttonSize?: ButtonSize;
    isDisabled?: boolean;
    isLoading?: boolean;
    fullWidth?: boolean;
    icon?: IconType;
    size?: number;
    alignIcon?: IconAlignment;
    'data-test'?: string;
}

export const Button = ({
    variant = 'primary',
    buttonSize = 'medium',
    isDisabled = false,
    isLoading = false,
    fullWidth = false,
    icon,
    size,
    alignIcon = 'left',
    children, // TODO: should be made required in later refactors
    ...rest
}: ButtonProps) => {
    const theme = useTheme();
    const hasLabel = !!children;

    const IconComponent = icon ? (
        <Icon
            icon={icon}
            size={size || getIconSize(buttonSize)}
            color={getIconColor(variant, isDisabled, theme)}
        />
    ) : null;

    const Loader = <Spinner size={getIconSize(buttonSize)} strokeWidth={2} />;

    return (
        <ButtonContainer
            variant={variant}
            size={buttonSize}
            hasLabel={hasLabel}
            alignIcon={alignIcon}
            disabled={isDisabled || isLoading}
            fullWidth={fullWidth}
            hasIcon={!!icon}
            {...rest}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}

            {children && (
                <Content size={buttonSize} disabled={isDisabled || isLoading}>
                    {children}
                </Content>
            )}
        </ButtonContainer>
    );
};
