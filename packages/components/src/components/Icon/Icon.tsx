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
    'info',
    'warning',
    'destructive',
    'purple',
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
};

export const getColorForIconVariant = ({
    variant,
    theme,
    color,
}: Pick<IconProps, 'color' | 'variant'> & { theme: DefaultTheme }): CSSColor => {
    if (color !== undefined) {
        return color;
    }

    return variant === undefined ? theme.iconDefault : theme[variantColorMap[variant]];
};

type SvgWrapperProps = TransientProps<Pick<IconProps, 'color' | 'variant'>> & {
    $cursorPointer?: boolean;
    $hoverColor?: string;
};

const SvgWrapper = styled.div<SvgWrapperProps & TransientProps<AllowedFrameProps>>`
    ${({ $cursorPointer }) =>
        $cursorPointer &&
        css`
            cursor: pointer;
        `}
    path {
        fill: ${({ $variant, $color, theme }) =>
            getColorForIconVariant({ variant: $variant, color: $color, theme })};
        transition: fill 0.14s;
    }

    &:hover {
        path {
            fill: ${({ $hoverColor }) => $hoverColor};
        }
    }

    ${withFrameProps}
`;

const SVG = styled(ReactSVG)`
    display: flex;
    align-items: center;
    justify-content: center;

    div {
        display: flex;
        align-items: center;
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

    /**
     * @deprecated This should not be used, only for back-compatibility.
     *             Use Link or some other clickable wrapping component.
     */
    cursorPointer?: boolean;
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
            cursorPointer,
            hoverColor,
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
            svg.setAttribute('width', `${iconSize}px`);
            svg.setAttribute('height', `${iconSize}px`);
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
                $cursorPointer={!!onClick || cursorPointer}
                $hoverColor={hoverColor}
                $color={color}
                $variant={variant}
                data-testid={dataTest}
                onClick={onClick ? handleClick : undefined}
                className={className}
                ref={ref}
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
