import { ButtonHTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { Spinner } from '../../loaders/Spinner/Spinner';
import {
    ButtonSize,
    ButtonVariant,
    getIconColor,
    getIconSize,
    getPadding,
    IconAlignment,
    useVariantStyle,
} from '../buttonStyleUtils';
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { makePropsTransient, TransientProps } from '../../../utils/transientProps';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../../utils/frameProps';
import { Icon, IconName } from '../../Icon/Icon';

export const allowedButtonFrameProps: FramePropsKeys[] = ['margin'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedButtonFrameProps)[number]>;

type ButtonContainerProps = TransientProps<AllowedFrameProps> & {
    $variant: ButtonVariant;
    $size: ButtonSize;
    $iconAlignment?: IconAlignment;
    $hasIcon?: boolean;
    $isFullWidth?: boolean;
    $isSubtle: boolean;
    $borderRadius?: typeof borders.radii.sm | typeof borders.radii.full; // Do not allow all, we want consistency
};

export const ButtonContainer = styled.button<ButtonContainerProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${({ $iconAlignment }) => $iconAlignment === 'right' && 'row-reverse'};
    gap: ${({ $hasIcon }) => $hasIcon && spacingsPx.xs};
    padding: ${({ $size }) => getPadding($size, true)};
    width: ${({ $isFullWidth }) => $isFullWidth && '100%'};
    border-radius: ${({ $borderRadius }) => $borderRadius ?? borders.radii.full};
    transition:
        ${focusStyleTransition},
        background 0.1s ease-out;
    outline: none;
    cursor: pointer;
    border: 1px solid transparent;

    ${getFocusShadowStyle()}
    ${({ $variant, $isSubtle }) => useVariantStyle($variant, $isSubtle)}

    &:disabled {
        background: ${({ theme }) => theme.backgroundNeutralDisabled};
        color: ${({ theme }) => theme.textDisabled};
        cursor: not-allowed;
    }

    ${withFrameProps}
`;

interface ContentProps {
    $size: ButtonSize;
    $disabled: boolean;
    $textWrap: boolean;
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
    white-space: ${({ $textWrap }) => ($textWrap ? 'normal' : 'nowrap')};
    overflow: hidden;
    text-overflow: ellipsis;

    ${({ $size }) => getTypography($size)};
`;

type SelectedHTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onClick' | 'onMouseOver' | 'onMouseLeave' | 'type' | 'tabIndex'
>;

export type ButtonProps = SelectedHTMLButtonProps &
    AllowedFrameProps & {
        variant?: ButtonVariant;
        isSubtle?: boolean;
        size?: ButtonSize;
        isDisabled?: boolean;
        isLoading?: boolean;
        isFullWidth?: boolean;
        icon?: IconName;
        iconSize?: number;
        iconAlignment?: IconAlignment;
        children: React.ReactNode;
        title?: string;
        className?: string;
        'data-testid'?: string;
        textWrap?: boolean;
    };

export const Button = ({
    variant = 'primary',
    size = 'medium',
    isDisabled = false,
    isLoading = false,
    isFullWidth = false,
    isSubtle = false,
    icon,
    iconSize,
    iconAlignment = 'left',
    type = 'button',
    children,
    margin,
    textWrap = true,
    ...rest
}: ButtonProps) => {
    const frameProps = {
        margin,
    };

    const theme = useTheme();

    const IconComponent = icon ? (
        <Icon
            name={icon}
            size={iconSize || getIconSize(size)}
            color={getIconColor({ variant, isDisabled, theme, isSubtle })}
        />
    ) : null;

    const Loader = (
        <Spinner size={getIconSize(size)} data-testid={`${rest['data-testid']}/spinner`} />
    );

    return (
        <ButtonContainer
            $variant={variant}
            $size={size}
            $iconAlignment={iconAlignment}
            disabled={isDisabled || isLoading}
            $isFullWidth={isFullWidth}
            $isSubtle={isSubtle}
            type={type}
            $hasIcon={!!icon || isLoading}
            {...rest}
            onClick={isDisabled ? undefined : rest?.onClick}
            {...makePropsTransient(frameProps)}
        >
            {!isLoading && icon && IconComponent}
            {isLoading && Loader}

            {children && (
                <Content $size={size} $disabled={isDisabled || isLoading} $textWrap={textWrap}>
                    {children}
                </Content>
            )}
        </ButtonContainer>
    );
};
