import { useEffect, useRef, useState } from 'react';
import styled, { CSSObject } from 'styled-components';
import { useElevation } from '../components/ElevationContext/ElevationContext';
import { Color, Elevation, mapElevationToBackground } from '@trezor/theme';
import { DefaultTheme } from 'styled-components';
import { UIHorizontalAlignment, UIVerticalAlignment } from '../config/types';

type GradientDirection = Exclude<UIHorizontalAlignment | UIVerticalAlignment, 'center'>;

interface GradientProps {
    $isVisible: boolean;
    $elevation: Elevation;
    $backgroundColor?: Color;
    $direction: GradientDirection;
}

type MapArgs = {
    $direction: GradientDirection;
    $backgroundColor?: Color;
    $elevation: Elevation;
    theme: DefaultTheme;
};

export const mapDirectionToGradient = ({
    $direction,
    $backgroundColor,
    $elevation,
    theme,
}: MapArgs): string => {
    const gradientColor = $backgroundColor
        ? theme[$backgroundColor]
        : mapElevationToBackground({ $elevation, theme });
    const gradientMap: Record<GradientDirection, GradientDirection> = {
        top: 'bottom',
        bottom: 'top',
        left: 'right',
        right: 'left',
    };

    return `linear-gradient(to ${gradientMap[$direction]}, ${gradientColor}, rgba(0 0 0 / 0%))`;
};

const ShadowContainer = styled.div`
    overflow: auto;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const Gradient = styled.div<GradientProps>`
    ${({ $direction }) => $direction && `${$direction}: 0;`}
    width: ${({ $direction }) =>
        $direction === 'left' || $direction === 'right' ? '60px' : '100%'};
    height: ${({ $direction }) =>
        $direction === 'left' || $direction === 'right' ? '100%' : '60px'};
    z-index: 1;
    position: absolute;
    pointer-events: none;
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: all 0.2s ease-in;
    background: ${({ $direction, $backgroundColor, $elevation, theme }) =>
        mapDirectionToGradient({ $direction, $backgroundColor, $elevation, theme })};
`;

export const useScrollShadow = () => {
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [isScrolledToLeft, setIsScrolledToLeft] = useState(true);
    const [isScrolledToRight, setIsScrolledToRight] = useState(true);

    const setShadows = () => {
        if (scrollElementRef?.current) {
            const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } =
                scrollElementRef.current;

            setIsScrolledToTop(scrollTop === 0);
            setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
            setIsScrolledToLeft(scrollLeft === 0);
            setIsScrolledToRight(Math.ceil(scrollLeft + clientWidth) >= scrollWidth);
        }
    };

    const { elevation } = useElevation();

    useEffect(() => {
        setShadows();
        window.addEventListener('resize', () => setShadows());
        window.addEventListener('orientationchange', () => setShadows());

        return () => {
            window.removeEventListener('resize', () => setShadows());
            window.removeEventListener('orientationchange', () => setShadows());
        };
    }, []);

    const onScroll = () => {
        setShadows();
    };
    type ShadowProps = { backgroundColor?: Color; style?: CSSObject };

    const ShadowTop = ({ backgroundColor, style }: ShadowProps) => (
        <Gradient
            $backgroundColor={backgroundColor}
            $elevation={elevation}
            style={style}
            $isVisible={!isScrolledToTop}
            $direction="top"
        />
    );
    const ShadowBottom = ({ backgroundColor, style }: ShadowProps) => (
        <Gradient
            $backgroundColor={backgroundColor}
            $elevation={elevation}
            style={style}
            $isVisible={!isScrolledToBottom}
            $direction="bottom"
        />
    );

    const ShadowLeft = ({ backgroundColor, style }: ShadowProps) => (
        <Gradient
            $backgroundColor={backgroundColor}
            $elevation={elevation}
            style={style}
            $isVisible={!isScrolledToLeft}
            $direction="left"
        />
    );

    const ShadowRight = ({ backgroundColor, style }: ShadowProps) => (
        <Gradient
            $backgroundColor={backgroundColor}
            $elevation={elevation}
            style={style}
            $isVisible={!isScrolledToRight}
            $direction="right"
        />
    );

    return {
        scrollElementRef,
        onScroll,
        ShadowContainer,
        ShadowTop,
        ShadowBottom,
        ShadowLeft,
        ShadowRight,
    };
};
