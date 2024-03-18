import styled, { css } from 'styled-components';

import { Ref, forwardRef, SVGAttributes } from 'react';
import { ReactSVG } from 'react-svg';
import { ICONS } from './icons';
import { UIVariant } from '../../../config/types';
import { CSSColor, Color, Colors } from '@trezor/theme';

export type IconVariant = Extract<
    UIVariant,
    'primary' | 'tertiary' | 'info' | 'warning' | 'destructive'
>;

const variantColorMap: Record<IconVariant, Color> = {
    primary: 'iconPrimaryDefault',
    tertiary: 'iconSubdued',
    info: 'iconAlertBlue',
    warning: 'iconAlertYellow',
    destructive: 'iconAlertRed',
};

type ColorProps = {
    $variant?: IconVariant;
    theme: Colors;
    $color?: string;
};

const getColorForIconVariant = ({
    $variant,
    theme,
    $color,
}: ColorProps): CSSColor | 'inherit' | string => {
    if ($color !== undefined) {
        return $color;
    }

    return $variant === undefined ? theme.iconDefault : theme[variantColorMap[$variant]];
};

export type IconType = keyof typeof ICONS;

type SvgWrapperProps = {
    $color: WrapperProps['color'] | undefined;
    $variant: IconVariant | undefined;
    $hoverColor: WrapperProps['hoverColor'];
    $size: WrapperProps['size'];
    $useCursorPointer: WrapperProps['useCursorPointer'];
};

const SvgWrapper = styled.div<SvgWrapperProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${({ $size }) => $size}px;
    width: ${({ $size }) => $size}px;

    div {
        display: flex;
        height: ${({ $size }) => $size}px;
        line-height: ${({ $size }) => $size}px;
        align-items: center;
        justify-content: center;
    }

    span {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    path {
        fill: ${getColorForIconVariant};
        transition: fill 0.14s;
    }

    &:hover {
        path {
            fill: ${({ $hoverColor }) => $hoverColor};
        }
    }

    ${({ $useCursorPointer }) =>
        $useCursorPointer &&
        css`
            cursor: pointer;
        `}
`;

type WrapperProps = Omit<IconProps, 'icon'>;

export type IconProps = SVGAttributes<HTMLDivElement> & {
    className?: string;
    icon: IconType;
    size?: number;
    hoverColor?: string;
    useCursorPointer?: boolean;
    'data-test'?: string;
} & (
        | { variant?: IconVariant; color?: undefined }
        | {
              variant?: undefined;
              /** @deprecated Use only is case of absolute desperation. Prefer using `variant`. */
              color?: string;
          }
    );

export const Icon = forwardRef(
    (
        {
            icon,
            size = 24,
            color,
            variant,
            hoverColor,
            useCursorPointer,
            className,
            onClick,
            onMouseEnter,
            onMouseLeave,
            'data-test': dataTest,
        }: IconProps,
        ref?: Ref<HTMLDivElement>,
    ) => (
        <SvgWrapper
            className={className}
            $hoverColor={hoverColor}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            $size={size}
            ref={ref}
            $useCursorPointer={onClick !== undefined || useCursorPointer}
            $color={color}
            $variant={variant}
            data-test={dataTest}
        >
            <ReactSVG
                src={ICONS[icon]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgWrapper>
    ),
);
