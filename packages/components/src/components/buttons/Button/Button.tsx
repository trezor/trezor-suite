import { ButtonHTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { borders, Elevation, spacingsPx, typography } from '@trezor/theme';
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
import { TransientProps } from '../../../utils/transientProps';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { Icon, IconName } from '../../Icon/Icon';
import { useElevation } from '../../ElevationContext/ElevationContext';

export const allowedButtonFrameProps = [
    'margin',
    'minWidth',
    'maxWidth',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedButtonFrameProps)[number]>;

type ButtonContainerProps = TransientProps<AllowedFrameProps> & {
    $borderRadius?: typeof borders.radii.sm | typeof borders.radii.full; // Do not allow all, we want consistency
    $elevation: Elevation;
    $hasIcon?: boolean;
    $iconAlignment?: IconAlignment;
    $isFullWidth?: boolean;
    $isSubtle: boolean;
    $size: ButtonSize;
    $variant: ButtonVariant;
    as?: 'a' | 'button';
};

export const ButtonContainer = styled.button<ButtonContainerProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${({ $iconAlignment }) => $iconAlignment === 'right' && 'row-reverse'};
    gap: ${({ $hasIcon }) => $hasIcon && spacingsPx.xs};
    padding: ${({ $size }) => getPadding($size, true)};
    width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'fit-content')};
    border-radius: ${({ $borderRadius }) => $borderRadius ?? borders.radii.full};
    transition:
        ${focusStyleTransition},
        background 0.1s ease-out;
    outline: none;
    cursor: pointer;
    border: 1px solid transparent;

    ${getFocusShadowStyle()}
    ${({ $variant, $isSubtle, $elevation }) => useVariantStyle($variant, $isSubtle, $elevation)}

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

type ExclusiveAProps =
    | { href?: undefined; target?: undefined }
    | {
          href?: string;
          target?: string;
      };

export type ButtonProps = SelectedHTMLButtonProps &
    AllowedFrameProps &
    ExclusiveAProps & {
        'data-testid'?: string;
        children: React.ReactNode;
        className?: string;
        icon?: IconName | React.ReactElement;
        iconAlignment?: IconAlignment;
        iconSize?: number;
        isDisabled?: boolean;
        isFullWidth?: boolean;
        isLoading?: boolean;
        isSubtle?: boolean;
        size?: ButtonSize;
        textWrap?: boolean;
        title?: string;
        variant?: ButtonVariant;
    };

export const Button = ({
    'data-testid': dataTestId,
    children,
    className,
    href,
    icon,
    iconAlignment = 'left',
    iconSize,
    isDisabled = false,
    isFullWidth = false,
    isLoading = false,
    isSubtle = false,
    onClick,
    onMouseLeave,
    onMouseOver,
    size = 'medium',
    tabIndex,
    target,
    textWrap = true,
    title,
    type = 'button',
    variant = 'primary',
    ...rest
}: ButtonProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedButtonFrameProps);
    const theme = useTheme();

    const getIcon = () => {
        if (!icon) return null;
        if (typeof icon === 'string') {
            return (
                <Icon
                    name={icon}
                    size={iconSize || getIconSize(size)}
                    color={getIconColor({ variant, isDisabled, theme, isSubtle })}
                />
            );
        }

        return icon;
    };

    const IconComponent = getIcon();

    const Loader = <Spinner size={getIconSize(size)} data-testid={`${dataTestId}/spinner`} />;

    const isLink = href !== undefined;

    const { elevation } = useElevation();

    return (
        <ButtonContainer
            $elevation={elevation}
            $hasIcon={!!icon || isLoading}
            $iconAlignment={iconAlignment}
            $isFullWidth={isFullWidth}
            $isSubtle={isSubtle}
            $size={size}
            $variant={variant}
            as={isLink ? 'a' : 'button'}
            className={className}
            data-testid={dataTestId}
            disabled={isDisabled || isLoading}
            href={href}
            onClick={isDisabled ? undefined : onClick}
            onMouseLeave={onMouseLeave}
            onMouseOver={onMouseOver}
            tabIndex={tabIndex}
            target={isLink ? target || '_blank' : undefined}
            title={title}
            type={type}
            {...frameProps}
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
