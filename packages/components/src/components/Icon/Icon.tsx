import { ReactSVG } from 'react-svg';
import { forwardRef, MouseEvent, Ref } from 'react';

import styled, { css, DefaultTheme } from 'styled-components';
import {
    IconProps as IconCommonProps,
    getIconSize,
    icons,
} from '@suite-common/icons/src/webComponents';
import { UIVariant } from '../../config/types';

import { CSSColor, Color } from '@trezor/theme';

import { makePropsTransient, TransientProps } from '../../utils/transientProps';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';

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
          color?: string;
      };

export const allowedIconFrameProps: FramePropsKeys[] = ['margin', 'pointerEvents'];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconFrameProps)[number]>;

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
}: Pick<IconProps, 'color' | 'variant'> & { theme: DefaultTheme }):
    | CSSColor
    | 'inherit'
    | string => {
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

    ${({ onClick }) =>
        onClick &&
        css`
            cursor: pointer;

            &:focus-visible {
                svg {
                    transition: opacity 0.2s;
                    opacity: 0.5;
                }
            }
        `}
` as typeof ReactSVG;

export type IconProps = AllowedFrameProps &
    Omit<IconCommonProps, 'color'> & {
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
            margin,
            pointerEvents,
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

        const frameProps = {
            margin,
            pointerEvents,
        };

        return (
            <SvgWrapper
                $cursorPointer={cursorPointer}
                $hoverColor={hoverColor}
                {...makePropsTransient(frameProps)}
                $color={color}
                $variant={variant}
                data-testid={dataTest}
                onClick={onClick ? handleClick : undefined}
                className={className}
                ref={ref}
            >
                <SVG
                    tabIndex={onClick ? 0 : undefined}
                    onKeyDown={handleOnKeyDown}
                    src={icons[name]}
                    beforeInjection={handleInjection}
                />
            </SvgWrapper>
        );
    },
);

export {
    type IconName,
    icons,
    type IconSize,
    iconSizes,
    getIconSize,
} from '@suite-common/icons/src/webComponents';
