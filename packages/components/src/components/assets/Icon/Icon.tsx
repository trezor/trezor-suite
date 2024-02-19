import styled, { css, useTheme } from 'styled-components';

import { Ref, forwardRef, SVGAttributes } from 'react';
import { ReactSVG } from 'react-svg';
import { ICONS } from './icons';

export type IconType = keyof typeof ICONS;

const SvgWrapper = styled.div<{
    $color: WrapperProps['color'];
    $hoverColor: WrapperProps['hoverColor'];
    $size: WrapperProps['size'];
    $useCursorPointer: WrapperProps['useCursorPointer'];
}>`
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
        fill: ${({ $color }) => $color};
        transition: fill 0.14s;
    }

    :hover {
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
export interface IconProps extends SVGAttributes<HTMLDivElement> {
    className?: string;
    icon: IconType;
    size?: number;
    color?: string;
    hoverColor?: string;
    useCursorPointer?: boolean;
    'data-test-id'?: string;
}

export const Icon = forwardRef(
    (
        {
            icon,
            size = 24,
            color,
            hoverColor,
            useCursorPointer,
            className,
            onClick,
            onMouseEnter,
            onMouseLeave,
            'data-test-id': dataTest,
        }: IconProps,
        ref?: Ref<HTMLDivElement>,
    ) => {
        const theme = useTheme();
        const defaultColor = color ?? theme.TYPE_LIGHT_GREY;

        return (
            <SvgWrapper
                className={className}
                $hoverColor={hoverColor}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                $size={size}
                ref={ref}
                $useCursorPointer={onClick !== undefined || useCursorPointer}
                $color={defaultColor}
                data-test-id={dataTest}
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
        );
    },
);
