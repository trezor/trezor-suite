import { ButtonHTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { Elevation, borders, spacingsPx, typography } from '@trezor/theme';
import { Icon, IconType } from '../../assets/Icon/Icon';
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
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { useElevation } from '../../ElevationContext/ElevationContext';

interface ButtonContainerProps {
    variant: ButtonVariant;
    size: ButtonSize;
    iconAlignment?: IconAlignment;
    hasIcon?: boolean;
    isFullWidth?: boolean;
    elevation: Elevation;
}

export const ButtonContainer = styled.button<ButtonContainerProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${({ iconAlignment }) => iconAlignment === 'right' && 'row-reverse'};
    gap: ${({ hasIcon }) => hasIcon && spacingsPx.xs};
    padding: ${({ size }) => getPadding(size, true)};
    width: ${({ isFullWidth }) => isFullWidth && '100%'};
    border-radius: ${borders.radii.full};
    transition:
        ${focusStyleTransition},
        background 0.1s ease-out;
    outline: none;
    cursor: pointer;
    border: 1px solid transparent;

    ${getFocusShadowStyle()}
    ${({ variant, elevation }) => getVariantStyle(variant, elevation)}

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
const getTypography = (size: ButtonSize) => {
    const map: Record<ButtonSize, string> = {
        large: typography.body,
        medium: typography.body,
        small: typography.hint,
        tiny: typography.hint,
    };

    return map[size];
};

const Content = styled.div<ContentProps>`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${({ size }) => getTypography(size)};
`;

type SelectedHTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'onMouseOver' | 'onMouseLeave' | 'type' | 'tabIndex'
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
    title?: string;
    className?: string;
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
    const { elevation } = useElevation();

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
            elevation={elevation}
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
