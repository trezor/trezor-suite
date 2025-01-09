import { ReactSVG } from 'react-svg';
import { forwardRef, MouseEvent, Ref } from 'react';

import styled, { css, DefaultTheme } from 'styled-components';

import {
    icons as iconsDeprecated,
    IconName as IconNameDeprecated,
} from '@suite-common/icons-deprecated';
import { icons, IconName as IconNameNew } from '@suite-common/icons/src/icons';
import { CSSColor, Color } from '@trezor/theme';

import { UIVariant } from '../../config/types';
import { TransientProps } from '../../utils/transientProps';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';

export const iconVariants = [
    'primary',
    'tertiary',
    'default',
    'info',
    'warning',
    'destructive',
    'purple',
    'disabled',
] as const;

export type IconVariant = Extract<UIVariant, (typeof iconVariants)[number]> | 'purple';

export type ExclusiveColorOrVariant =
    | { variant?: IconVariant; color?: undefined }
    | {
          variant?: undefined;
          /** @deprecated Use only is case of absolute desperation. Prefer using `variant`. */
          color?: CSSColor;
      };

export const allowedIconFrameProps = [
    'margin',
    'pointerEvents',
    'cursor',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconFrameProps)[number]>;

export const iconSizes = {
    extraSmall: 8,
    small: 12,
    medium: 16,
    mediumLarge: 20,
    large: 24,
    extraLarge: 32,
} as const;

export type IconSize = keyof typeof iconSizes;

export const getIconSize = (size: IconSize | number) =>
    typeof size === 'string' ? iconSizes[size] : size;

const variantColorMap: Record<IconVariant, Color> = {
    primary: 'iconPrimaryDefault',
    tertiary: 'iconSubdued',
    info: 'iconAlertBlue',
    warning: 'iconAlertYellow',
    destructive: 'iconAlertRed',
    purple: 'iconAlertPurple',
    default: 'iconDefault',
    disabled: 'iconDisabled',
};

export const getColorForIconVariant = ({
    variant,
    theme,
    color,
}: Pick<IconProps, 'color' | 'variant'> & { theme: DefaultTheme }): CSSColor =>
    color ?? (variant ? theme[variantColorMap[variant]] : 'currentColor');

type SvgWrapperProps = TransientProps<Pick<IconProps, 'color' | 'variant'>> & {
    $hoverColor?: string;
    $size: number;
};

const SvgWrapper = styled.div<SvgWrapperProps & TransientProps<AllowedFrameProps>>`
    ${({ $size }) => css`
        width: ${$size}px;
        height: ${$size}px;
    `}

    path {
        fill: ${({ $variant, $color, theme }) =>
            getColorForIconVariant({ variant: $variant, color: $color, theme })};
        transition: fill 0.14s;
    }

    flex-shrink: 0;

    &:hover {
        path {
            fill: ${({ $hoverColor }) => $hoverColor};
        }
    }

    ${withFrameProps}
`;

const SVG = styled(ReactSVG)`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;

    div {
        display: flex;
        justify-content: center;
    }

    path {
        transition:
            stroke 0.15s,
            fill 0.15s;
    }
` as typeof ReactSVG;

export type IconName = IconNameNew | IconNameDeprecated;

export type IconProps = AllowedFrameProps & {
    name: IconName;
    size?: IconSize | number;
    onClick?: (e: any) => void;
    className?: string;
    'data-testid'?: string;
    hoverColor?: string;
} & ExclusiveColorOrVariant;

export const Icon = forwardRef(
    (
        {
            name,
            size = 'large',
            color,
            variant,
            onClick,
            className,
            'data-testid': dataTest,
            hoverColor,
            cursor,
            ...rest
        }: IconProps,
        ref?: Ref<HTMLDivElement>,
    ) => {
        const iconSize = getIconSize(size);

        const handleOnKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                onClick?.(e);
            }
        };

        const handleInjection = (svg: SVGSVGElement) => {
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
        };

        const handleClick = (e: MouseEvent<any>) => {
            onClick?.(e);

            // We need to stop default/propagation in case the icon is rendered in popup/modal so it won't close it.
            e.preventDefault();
            e.stopPropagation();
        };

        const frameProps = pickAndPrepareFrameProps(rest, allowedIconFrameProps);

        return (
            <SvgWrapper
                $hoverColor={hoverColor}
                $color={color}
                $size={iconSize}
                $variant={variant}
                data-testid={dataTest}
                onClick={onClick ? handleClick : undefined}
                className={className}
                ref={ref}
                $cursor={cursor ?? (onClick ? 'pointer' : undefined)}
                {...frameProps}
            >
                <SVG
                    tabIndex={onClick ? 0 : undefined}
                    onKeyDown={handleOnKeyDown}
                    src={icons[name as IconNameNew] ?? iconsDeprecated[name as IconNameDeprecated]}
                    beforeInjection={handleInjection}
                />
            </SvgWrapper>
        );
    },
);
