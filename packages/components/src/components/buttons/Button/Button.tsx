import { ButtonHTMLAttributes } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { borders, boxShadows, spacingsPx, typography } from '@trezor/theme';
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
import { MEDIA_QUERY } from '../../../config/variables';

interface ButtonContainerProps {
    variant: ButtonVariant;
    size: ButtonSize;
    iconAlignment?: IconAlignment;
    hasIcon?: boolean;
    isFullWidth?: boolean;
}

export const focusShadowStyle = css`
    border: 1px solid transparent;

    :focus-visible {
        border-color: ${({ theme }) => theme.backgroundAlertBlueBold};
        box-shadow: ${boxShadows.focusedLight};
    }

    ${MEDIA_QUERY.DARK_THEME} {
        :focus-visible {
            box-shadow: ${boxShadows.focusedDark};
        }
    }
`;

export const ButtonContainer = styled.button<ButtonContainerProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${({ iconAlignment }) => iconAlignment === 'right' && 'row-reverse'};
    gap: ${({ hasIcon }) => hasIcon && spacingsPx.xs};
    padding: ${({ size }) => getPadding(size, true)};
    width: ${({ isFullWidth }) => isFullWidth && '100%'};
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

type SelectedHTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'onMouseOver' | 'onMouseLeave' | 'type'
>;

export interface ButtonProps extends SelectedHTMLButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isDisabled?: boolean;
    isLoading?: boolean;
    isFullWidth?: boolean;
    icon?: IconType;
    iconSize?: number;
    iconAlignment?: IconAlignment;
    children: React.ReactNode;
    'data-test'?: string;
}

export const Button = ({
    variant = 'primary',
    size = 'medium',
    isDisabled = false,
    isLoading = false,
    isFullWidth = false,
    icon,
    iconSize,
    iconAlignment = 'left',
    type = 'button',
    children,
    ...rest
}: ButtonProps) => {
    const theme = useTheme();

    const IconComponent = icon ? (
        <Icon
            icon={icon}
            size={iconSize || getIconSize(size)}
            color={getIconColor(variant, isDisabled, theme)}
        />
    ) : null;

    const Loader = <Spinner size={getIconSize(size)} />;

    return (
        <ButtonContainer
            variant={variant}
            size={size}
            iconAlignment={iconAlignment}
            disabled={isDisabled || isLoading}
            isFullWidth={isFullWidth}
            type={type}
            hasIcon={!!icon || isLoading}
            {...rest}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}

            {children && (
                <Content size={size} disabled={isDisabled || isLoading}>
                    {children}
                </Content>
            )}
        </ButtonContainer>
    );
};
