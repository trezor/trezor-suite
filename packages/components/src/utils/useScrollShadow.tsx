import {
    type CSSProperties,
    type RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import styled, { type DefaultTheme } from 'styled-components';

import { type Color, type Elevation, mapElevationToBackground } from '@trezor/theme';

import { useElevation } from '../components/ElevationContext/ElevationContext';

type GradientDirection = 'bottom' | 'top' | 'right' | 'left';

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
        $direction === 'left' || $direction === 'right' ? '60px' : 'calc(100% - 15px)'};
    height: ${({ $direction }) =>
        $direction === 'left' || $direction === 'right' ? '100%' : '60px'};
    z-index: 1;
    position: absolute;
    pointer-events: none;
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    background: ${({ $direction, $backgroundColor, $elevation, theme }) =>
        mapDirectionToGradient({ $direction, $backgroundColor, $elevation, theme })};
`;

export const useScrollShadow = (externalRef?: RefObject<HTMLDivElement | null>) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollElementRef = externalRef || internalRef;

    const [isScrolledToTop, setIsScrolledToTop] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [isScrolledToLeft, setIsScrolledToLeft] = useState(true);
    const [isScrolledToRight, setIsScrolledToRight] = useState(true);

    const setShadows = useCallback(() => {
        if (scrollElementRef?.current) {
            const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } =
                scrollElementRef.current;

            setIsScrolledToTop(scrollTop === 0);
            setIsScrolledToBottom(Math.ceil(scrollTop + clientHeight) >= scrollHeight);
            setIsScrolledToLeft(scrollLeft === 0);
            setIsScrolledToRight(Math.ceil(scrollLeft + clientWidth) >= scrollWidth);
        }
    }, [scrollElementRef]);

    const { elevation } = useElevation();

    useEffect(() => {
        setShadows();

        const observer = new ResizeObserver(() => {
            setShadows();
        });

        if (scrollElementRef?.current) {
            observer.observe(scrollElementRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [scrollElementRef, setShadows]);

    const onScroll = useCallback(setShadows, [setShadows]);

    type ShadowProps = { backgroundColor?: Color; style?: CSSProperties };

    const ShadowTop = useCallback(
        ({ backgroundColor, style }: ShadowProps) => (
            <Gradient
                $backgroundColor={backgroundColor}
                $elevation={elevation}
                style={style}
                $isVisible={!isScrolledToTop}
                $direction="top"
            />
        ),
        [elevation, isScrolledToTop],
    );

    const ShadowBottom = useCallback(
        ({ backgroundColor, style }: ShadowProps) => (
            <Gradient
                $backgroundColor={backgroundColor}
                $elevation={elevation}
                style={style}
                $isVisible={!isScrolledToBottom}
                $direction="bottom"
            />
        ),
        [elevation, isScrolledToBottom],
    );

    const ShadowLeft = useCallback(
        ({ backgroundColor, style }: ShadowProps) => (
            <Gradient
                $backgroundColor={backgroundColor}
                $elevation={elevation}
                style={style}
                $isVisible={!isScrolledToLeft}
                $direction="left"
            />
        ),
        [elevation, isScrolledToLeft],
    );

    const ShadowRight = useCallback(
        ({ backgroundColor, style }: ShadowProps) => (
            <Gradient
                $backgroundColor={backgroundColor}
                $elevation={elevation}
                style={style}
                $isVisible={!isScrolledToRight}
                $direction="right"
            />
        ),
        [elevation, isScrolledToRight],
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
